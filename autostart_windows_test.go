package main

import (
	"strings"
	"testing"
)

// Registering a HighestAvailable task needs elevation, so this skips in CI and
// in an ordinary shell. Run it from the same elevated terminal as `wails dev`.
func TestAutostartRoundTrip(t *testing.T) {
	err := setAutostart(true)
	if err != nil && strings.Contains(err.Error(), "Access is denied") {
		t.Skip("needs an elevated shell")
	}
	if err != nil {
		t.Fatal(err)
	}
	if !autostartEnabled() {
		t.Fatal("task missing after enable")
	}
	if err := setAutostart(false); err != nil {
		t.Fatal(err)
	}
	if autostartEnabled() {
		t.Fatal("task still there after disable")
	}
	if err := setAutostart(false); err != nil {
		t.Fatal("disabling twice must be a no-op:", err)
	}
}
