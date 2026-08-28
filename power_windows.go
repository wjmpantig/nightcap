package main

import (
	"errors"
	"os/exec"
	"strings"

	"golang.org/x/sys/windows"
)

var errNeedsAdmin = errors.New("nightcap needs to run as administrator to see what is keeping the PC awake")

// readPowerRequests shells out to powercfg. There is a documented API
// (CallNtPowerInformation) but it returns an undocumented blob whose layout has
// shifted between Windows builds; the CLI is the stable contract.
func readPowerRequests() ([]Request, error) {
	cmd := exec.Command("powercfg", "/requests")
	cmd.SysProcAttr = &windows.SysProcAttr{HideWindow: true}
	out, err := cmd.CombinedOutput()
	text := string(out)

	if err != nil || looksUnprivileged(text) {
		if looksUnprivileged(text) || !windows.GetCurrentProcessToken().IsElevated() {
			return nil, errNeedsAdmin
		}
		if err != nil {
			return nil, errors.New("powercfg failed: " + strings.TrimSpace(text))
		}
	}
	return parsePowercfg(text), nil
}

func looksUnprivileged(s string) bool {
	s = strings.ToLower(s)
	return strings.Contains(s, "privilege") ||
		strings.Contains(s, "administrator") ||
		strings.Contains(s, "access is denied")
}

func sampleSystem() (Snapshot, error) {
	reqs, err := readPowerRequests()
	if err != nil {
		return Snapshot{}, err
	}
	// Resolve owning apps for any shared-runtime holder before deciding.
	reqs = annotateHosts(reqs, func() map[uint32]procInfo {
		t, err := processTable()
		if err != nil {
			return nil
		}
		return t
	})
	return Snapshot{
		IdleFor:    idleTime(),
		Fullscreen: isFullscreenActive(),
		Requests:   reqs,
	}, nil
}
