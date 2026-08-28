package main

import (
	"encoding/json"
	"strings"
	"testing"
)

// Go marshals nil slices as null, and the frontend calls .filter()/.map() on
// these fields directly. A null here throws inside render and leaves a blank
// window, so every array crossing the boundary must be [] and never null.
func TestStatusHasNoNullArrays(t *testing.T) {
	w := newWatcher(&store{cfg: defaultConfig()})

	// The dangerous case: GetStatus() served before the first tick has run.
	assertNoNulls(t, "zero status", w.status())

	// And after a tick that failed, which takes the early-return path and
	// publishes a Status carrying nothing but an error.
	w.sample = func() (Snapshot, error) { return Snapshot{}, errNeedsAdmin }
	w.tick()
	assertNoNulls(t, "status after a failed poll", w.status())

	// And after a successful tick whose requests have no resolved hosts.
	w.sample = func() (Snapshot, error) {
		return Snapshot{Requests: []Request{{Category: "SYSTEM", Kind: "PROCESS", Exe: "vlc.exe"}}}, nil
	}
	w.tick()
	st := w.status()
	assertNoNulls(t, "status with requests", st)
	if st.Requests[0].Hosts == nil {
		t.Error("Request.Hosts is nil; it marshals to null and breaks .length checks")
	}
}

// The same hazard applies to Config, which the frontend maps over directly.
func TestConfigHasNoNullArrays(t *testing.T) {
	assertNoNulls(t, "default config", defaultConfig())
	assertNoNulls(t, "sanitized empty config", sanitize(Config{}))

	var fromDisk Config
	if err := json.Unmarshal([]byte(`{"defaultTimeoutMinutes":15}`), &fromDisk); err != nil {
		t.Fatal(err)
	}
	assertNoNulls(t, "config loaded from a file with no arrays", sanitize(fromDisk))
}

// Guards against the test above going vacuous: the raw type really does
// marshal to null, so normalize() is doing the work, not luck.
func TestRawStatusWouldMarshalNull(t *testing.T) {
	b, err := json.Marshal(Status{})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(b), `"requests":null`) {
		t.Fatalf("expected an unnormalized Status to marshal requests as null, got %s", b)
	}
}

func assertNoNulls(t *testing.T, what string, v any) {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal %s: %v", what, err)
	}
	if strings.Contains(string(b), ":null") {
		t.Errorf("%s marshals a null array, which will blank the UI: %s", what, b)
	}
}
