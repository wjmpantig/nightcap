package main

import (
	"context"
	"crypto/ed25519"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// nightcap checks for a new release by fetching a small signed manifest from
// the newest non-prerelease GitHub release:
//
//	.../releases/latest/download/update.json
//	.../releases/latest/download/update.json.sig
//
// The manifest rather than api.github.com/.../releases/latest, for three
// reasons: an API response cannot be signed, the unauthenticated API is rate
// limited to 60 requests an hour per IP, and this way the JSON shape is ours.
//
// The signature is the point. nightcap runs elevated on Windows, so anything
// it is told to trust is worth a great deal to an attacker. TLS alone would
// mean whoever can publish a release — or steal the token that can — decides
// what this app tells the user to install. The public key below is compiled
// in, and only the holder of the matching private key can produce a manifest
// this build will accept.
//
// The key is here now rather than when self-replacing updates arrive, because
// a public key cannot be backfilled: copies already installed would have no
// way to learn it.
const (
	updateManifestURL = "https://github.com/wjmpantig/nightcap/releases/latest/download/update.json"
	updateSigURL      = updateManifestURL + ".sig"

	// Raw 32-byte ed25519 public key, hex. Empty until one is generated, which
	// disables update checks entirely rather than trusting anything. Generate
	// with:
	//
	//	openssl genpkey -algorithm ed25519 -out nightcap-update.pem
	//	openssl pkey -in nightcap-update.pem -pubout -outform DER | tail -c 32 | xxd -p -c 32
	//
	// (Needs real OpenSSL; macOS's /usr/bin/openssl is LibreSSL and has no
	// -rawin.) The private half lives in the UPDATE_SIGNING_KEY repo secret
	// and nowhere in this tree.
	updateKeyHex = ""
)

// Update is what the frontend is told about a newer release. It has no slice
// fields on purpose, so it needs no entry in normalize() — see the nil-slice
// note in CLAUDE.md before adding one.
type Update struct {
	Version string `json:"version"`
	URL     string `json:"url"`
}

// updateKey is the compiled-in public key, or nil if there is not a usable one.
// Every rejection here fails closed: no update is offered, rather than one
// being offered unverified.
func updateKey() ed25519.PublicKey { return parseUpdateKey(updateKeyHex) }

// parseUpdateKey is split out from updateKey so the rejections below can be
// tested without the constant being involved.
func parseUpdateKey(s string) ed25519.PublicKey {
	b, err := hex.DecodeString(s)
	if err != nil || len(b) != ed25519.PublicKeySize {
		return nil
	}
	// An all-zero key must be rejected explicitly, and this is not paranoia.
	// All-zero bytes decode to a point of order 4, not to the identity, so the
	// verification equation [S]B = R + [k]A collapses whenever the message
	// hash k is 3 mod 4 — and then 64 zero bytes verify as a valid signature.
	// It only bites for about one message in four, which is no comfort at all:
	// the manifest text is attacker-chosen, so grinding whitespace until it
	// lands is trivial. A zero placeholder is therefore not an inert key, it
	// is a key that accepts forgeries. See TestZeroKeyAcceptsAForgery.
	var zero [ed25519.PublicKeySize]byte
	if subtle.ConstantTimeCompare(b, zero[:]) == 1 {
		return nil
	}
	return ed25519.PublicKey(b)
}

// parseManifest verifies sig over body and only then reads it.
//
// The order is the whole security property: unmarshalling first would mean
// parsing attacker-controlled bytes before knowing whether they are ours.
func parseManifest(body, sig []byte, key ed25519.PublicKey) (Update, error) {
	if len(key) != ed25519.PublicKeySize {
		return Update{}, fmt.Errorf("no usable update signing key compiled in")
	}
	if !ed25519.Verify(key, body, sig) {
		return Update{}, fmt.Errorf("update manifest signature does not verify")
	}
	var u Update
	if err := json.Unmarshal(body, &u); err != nil {
		return Update{}, fmt.Errorf("update manifest: %w", err)
	}
	if u.Version == "" || u.URL == "" {
		return Update{}, fmt.Errorf("update manifest is missing version or url")
	}
	// A signed manifest could still point anywhere; keep it on the release host
	// so a signing mistake cannot turn into "click here to download this".
	if !strings.HasPrefix(u.URL, "https://github.com/wjmpantig/nightcap/") {
		return Update{}, fmt.Errorf("update manifest url is not a nightcap release: %s", u.URL)
	}
	return u, nil
}

// newer reports whether latest is a release after current.
//
// This is the whole "should we nag" rule, kept pure and here rather than
// spread across the fetch and the UI.
func newer(current, latest string) bool {
	// A working-tree build has no place on the release timeline, so it is never
	// told to update. Without this, every `wails build` nags immediately.
	if current == "" || current == "dev" {
		return false
	}
	c, ok := parseVersion(current)
	if !ok {
		return false
	}
	l, ok := parseVersion(latest)
	if !ok {
		return false // never nag on a manifest we cannot read
	}
	for i := range c {
		if l[i] != c[i] {
			return l[i] > c[i] // also covers running ahead of the feed
		}
	}
	return false
}

// parseVersion reads a "v1.2.3" tag into its three numbers. A missing "v" and
// a short tag ("v1.2" -> 1.2.0) are both tolerated; a prerelease suffix is
// dropped, so v1.2.3-rc1 compares equal to v1.2.3 rather than sorting oddly.
func parseVersion(s string) ([3]int, bool) {
	var out [3]int
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "v")
	if i := strings.IndexAny(s, "-+"); i >= 0 {
		s = s[:i]
	}
	parts := strings.Split(s, ".")
	if len(parts) == 0 || len(parts) > 3 {
		return out, false
	}
	for i, p := range parts {
		n, err := strconv.Atoi(p)
		if err != nil || n < 0 {
			return out, false
		}
		out[i] = n
	}
	return out, true
}

// fetchUpdate is the I/O half: two GETs and a verify. The logic it defers to
// (parseManifest, newer) is pure and tested; this is plumbing.
func fetchUpdate(ctx context.Context) (Update, error) {
	c := &http.Client{Timeout: 15 * time.Second}
	body, err := get(ctx, c, updateManifestURL)
	if err != nil {
		return Update{}, err
	}
	sig, err := get(ctx, c, updateSigURL)
	if err != nil {
		return Update{}, err
	}
	return parseManifest(body, sig, updateKey())
}

func get(ctx context.Context, c *http.Client, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		// A release published without the manifest 404s here. That is the
		// expected state until the first signed release, not an error worth
		// showing anyone.
		return nil, fmt.Errorf("%s: %s", url, resp.Status)
	}
	// The manifest is tens of bytes and the signature is exactly 64; cap the
	// read so a wrong URL cannot stream something huge into memory.
	return io.ReadAll(io.LimitReader(resp.Body, 64<<10))
}
