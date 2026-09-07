package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
)

func TestNewer(t *testing.T) {
	cases := []struct {
		current, latest string
		want            bool
	}{
		{"v1.0.0", "v1.0.1", true},
		{"v1.0.0", "v1.1.0", true},
		{"v1.0.0", "v2.0.0", true},
		{"v1.9.9", "v1.10.0", true}, // numeric, not lexical
		{"1.0.0", "1.0.1", true},    // the "v" is optional either side
		{"v1.0", "v1.0.1", true},    // short tag reads as 1.0.0
		{"v1.0.0", "v1.0.0", false},
		{"v1.0.1", "v1.0.0", false}, // running ahead of the feed
		{"v2.0.0", "v1.9.9", false},

		// A working-tree build is not on the release timeline. Without this,
		// every local `wails build` nags on first launch.
		{"dev", "v9.9.9", false},
		{"", "v9.9.9", false},

		// Never nag on something we could not read.
		{"v1.0.0", "", false},
		{"v1.0.0", "banana", false},
		{"v1.0.0", "v1.0.0.1", false},
		{"v1.0.0", "v1.-2.0", false},
		{"garbage", "v9.9.9", false},

		// A prerelease compares as its release core, so rc1 of the version we
		// already run is not an update.
		{"v1.2.3", "v1.2.3-rc1", false},
		{"v1.2.3", "v1.2.4-rc1", true},
	}
	for _, c := range cases {
		if got := newer(c.current, c.latest); got != c.want {
			t.Errorf("newer(%q, %q) = %v, want %v", c.current, c.latest, got, c.want)
		}
	}
}

// manifest signs a body with a throwaway key, so the test needs no fixture
// files and no network.
func manifest(t *testing.T, body string) (ed25519.PublicKey, []byte, []byte) {
	t.Helper()
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	return pub, []byte(body), ed25519.Sign(priv, []byte(body))
}

const goodManifest = `{"version":"v1.1.0","url":"https://github.com/wjmpantig/nightcap/releases/tag/v1.1.0"}`

func TestParseManifest(t *testing.T) {
	pub, body, sig := manifest(t, goodManifest)

	u, err := parseManifest(body, sig, pub)
	if err != nil {
		t.Fatalf("good manifest rejected: %v", err)
	}
	if u.Version != "v1.1.0" {
		t.Errorf("version = %q", u.Version)
	}
}

func TestParseManifestRejects(t *testing.T) {
	pub, body, sig := manifest(t, goodManifest)

	// A flipped body byte and a flipped signature byte must both fail: this is
	// the whole reason the manifest is signed. nightcap runs elevated on
	// Windows, so an unverified manifest is an attacker telling the user what
	// to install.
	t.Run("tampered body", func(t *testing.T) {
		bad := append([]byte(nil), body...)
		bad[3] ^= 1
		if _, err := parseManifest(bad, sig, pub); err == nil {
			t.Fatal("tampered body accepted")
		}
	})

	t.Run("tampered signature", func(t *testing.T) {
		bad := append([]byte(nil), sig...)
		bad[0] ^= 1
		if _, err := parseManifest(body, bad, pub); err == nil {
			t.Fatal("tampered signature accepted")
		}
	})

	t.Run("wrong key", func(t *testing.T) {
		other, _, _ := ed25519.GenerateKey(nil)
		if _, err := parseManifest(body, sig, other); err == nil {
			t.Fatal("signature from another key accepted")
		}
	})

	// No key compiled in must fail closed: no update offered, rather than one
	// offered unverified.
	t.Run("no key", func(t *testing.T) {
		if _, err := parseManifest(body, sig, nil); err == nil {
			t.Fatal("missing key accepted")
		}
	})

	// A validly signed manifest is still not allowed to point anywhere it
	// likes, so a signing slip cannot become "download this instead".
	t.Run("offsite url", func(t *testing.T) {
		pub, body, sig := manifest(t, `{"version":"v1.1.0","url":"https://evil.example/x"}`)
		if _, err := parseManifest(body, sig, pub); err == nil {
			t.Fatal("offsite url accepted")
		}
	})

	for _, body := range []string{
		`{"version":"v1.1.0"}`,
		`{"url":"https://github.com/wjmpantig/nightcap/releases/tag/v1.1.0"}`,
		`not json`,
	} {
		pub, b, sig := manifest(t, body)
		if _, err := parseManifest(b, sig, pub); err == nil {
			t.Errorf("incomplete manifest accepted: %s", body)
		}
	}
}

// The compiled-in key is either absent (update checks off) or a real, usable
// key. A half-edited constant must not read as usable.
func TestUpdateKeyIsWellFormed(t *testing.T) {
	if updateKeyHex == "" {
		if updateKey() != nil {
			t.Fatal("empty updateKeyHex must yield no key")
		}
		t.Skip("no signing key compiled in yet; update checks are disabled")
	}
	if len(updateKeyHex) != ed25519.PublicKeySize*2 {
		t.Fatalf("updateKeyHex is %d chars, want %d", len(updateKeyHex), ed25519.PublicKeySize*2)
	}
	if updateKey() == nil {
		t.Fatal("updateKeyHex does not decode to a usable ed25519 public key")
	}
}

// parseUpdateKey must refuse anything it cannot fully trust. The all-zero case
// is the important one and is NOT merely defensive — see
// TestZeroKeyAcceptsAForgery below for the proof that it is exploitable.
func TestParseUpdateKeyRejects(t *testing.T) {
	zeros := strings.Repeat("00", ed25519.PublicKeySize)
	for name, hexKey := range map[string]string{
		"empty":     "",
		"all zero":  zeros,
		"too short": strings.Repeat("ab", 31),
		"too long":  strings.Repeat("ab", 33),
		"not hex":   strings.Repeat("zz", 32),
	} {
		if parseUpdateKey(hexKey) != nil {
			t.Errorf("%s key was accepted", name)
		}
	}
	// A real key still works.
	pub, _, err := ed25519.GenerateKey(nil)
	if err != nil {
		t.Fatal(err)
	}
	if parseUpdateKey(hex.EncodeToString(pub)) == nil {
		t.Error("a valid key was rejected")
	}
}

// Proof that an all-zero public key is dangerous rather than inert: there
// exist messages for which 64 zero bytes verify as a valid signature under it,
// because all-zero bytes decode to an order-4 point. Roughly one message in
// four works, so this grinds a counter until it finds one — which is exactly
// what an attacker with control of the manifest text would do.
//
// This test exists to justify the guard in parseUpdateKey. If the stdlib ever
// starts rejecting small-order keys outright, this fails loudly and the guard
// can become belt-and-braces rather than load-bearing.
func TestZeroKeyAcceptsAForgery(t *testing.T) {
	zero := make(ed25519.PublicKey, ed25519.PublicKeySize)
	zeroSig := make([]byte, ed25519.SignatureSize)
	for i := 0; i < 100; i++ {
		forged := fmt.Sprintf(`{"version":"v9.9.9","url":"https://evil.example/x"}%s`, strings.Repeat(" ", i))
		if ed25519.Verify(zero, []byte(forged), zeroSig) {
			// Confirmed exploitable. The guard must stop it before this point.
			if parseUpdateKey(strings.Repeat("00", ed25519.PublicKeySize)) != nil {
				t.Fatal("zero key accepted by parseUpdateKey despite accepting forgeries")
			}
			return
		}
	}
	t.Fatal("no forgery found in 100 attempts; the stdlib may have changed - re-check the guard")
}

// Update crosses the Go/JS boundary, so it must marshal to the field names the
// frontend reads. See json_test.go for the rest of the boundary types.
func TestUpdateJSON(t *testing.T) {
	b, err := json.Marshal(Update{Version: "v1.1.0", URL: "https://x"})
	if err != nil {
		t.Fatal(err)
	}
	if got, want := string(b), `{"version":"v1.1.0","url":"https://x"}`; got != want {
		t.Errorf("Update JSON = %s, want %s", got, want)
	}
}
