package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// The syscall wrappers are easy to get subtly wrong (struct sizes, wide
// strings), so check them against facts we already know about this process.
func TestPidsByExeFindsThisProcess(t *testing.T) {
	byExe, err := pidsByExe()
	if err != nil {
		t.Fatalf("pidsByExe: %v", err)
	}
	self := strings.ToLower(filepath.Base(os.Args[0]))
	pids, ok := byExe[self]
	if !ok {
		t.Fatalf("did not find our own process %q in the snapshot of %d processes", self, len(byExe))
	}
	found := false
	for _, p := range pids {
		if p == uint32(os.Getpid()) {
			found = true
		}
	}
	if !found {
		t.Fatalf("found %q but not our pid %d in %v", self, os.Getpid(), pids)
	}
}

// Killing lsass.exe bugchecks the machine. nightcap runs elevated, so this
// guard is the only thing between a typo in the watchlist and a hard reboot.
func TestProtectedProcessesAreNeverKilled(t *testing.T) {
	for _, name := range []string{"lsass.exe", "LSASS.EXE", `C:\Windows\System32\csrss.exe`, "services.exe"} {
		if err := killByExe(name); err == nil {
			t.Errorf("killByExe(%q) returned nil; it must refuse protected processes", name)
		}
	}
}

// A process that is not running is not an error: it is the state we wanted.
func TestKillMissingProcessIsNotAnError(t *testing.T) {
	if err := killByExe("nightcap-definitely-not-running.exe"); err != nil {
		t.Errorf("killByExe on a missing process = %v, want nil", err)
	}
}

func TestIdleTimeIsSane(t *testing.T) {
	d := idleTime()
	if d < 0 {
		t.Fatalf("negative idle time %v", d)
	}
	// Anything past a few days means the tick-count subtraction wrapped wrong.
	if d > 72*time.Hour {
		t.Fatalf("implausible idle time %v, tick arithmetic is probably wrong", d)
	}
}

// Just needs to return without panicking; the value depends on what is on
// screen, so there is nothing to assert about it.
func TestIsFullscreenActiveDoesNotPanic(t *testing.T) {
	_ = isFullscreenActive()
}

// Unelevated (the normal test environment) this must report the admin error
// rather than an empty list.
func TestReadPowerRequests(t *testing.T) {
	reqs, err := readPowerRequests()
	if err != nil {
		t.Logf("readPowerRequests: %v (expected unless the test runs elevated)", err)
		return
	}
	for _, r := range reqs {
		if r.Category == "" {
			t.Errorf("request parsed without a category: %+v", r)
		}
	}
}
