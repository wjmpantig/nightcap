package main

import (
	"errors"
	"os/exec"
	"strings"
)

// readAssertions shells out to pmset. There is a real API
// (IOPMCopyAssertionsByProcess) but it returns CF containers that need a pile
// of cgo to walk for the same information; the CLI is the stable contract and,
// unlike powercfg on Windows, needs no elevation.
func readAssertions() ([]assertion, error) {
	out, err := exec.Command("pmset", "-g", "assertions").CombinedOutput()
	if err != nil {
		return nil, errors.New("pmset failed: " + strings.TrimSpace(string(out)))
	}
	return parsePmset(string(out)), nil
}

func sampleSystem() (Snapshot, error) {
	asserts, err := readAssertions()
	if err != nil {
		return Snapshot{}, err
	}
	// One table serves both name resolution and host annotation. Best effort:
	// without it pmset's own (truncated) names still identify the holders.
	var table map[uint32]procInfo
	if len(asserts) > 0 {
		table, _ = processTable()
	}
	reqs := assertionRequests(asserts, table)
	reqs = annotateHosts(reqs, func() map[uint32]procInfo { return table })
	return Snapshot{
		IdleFor:    idleTime(),
		Fullscreen: isFullscreenActive(),
		Requests:   reqs,
	}, nil
}
