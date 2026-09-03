package main

import "testing"

func TestLooksUnprivileged(t *testing.T) {
	// The exact string Windows prints when powercfg is run unelevated.
	real := "This command requires administrator privileges and must be executed from an elevated command prompt."
	if !looksUnprivileged(real) {
		t.Error("failed to detect the unprivileged powercfg message")
	}
	if looksUnprivileged(powercfgFixture) {
		t.Error("normal output misdetected as unprivileged")
	}
}
