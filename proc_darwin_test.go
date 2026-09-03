package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// The libproc wrappers are easy to get subtly wrong (struct sizes, truncated
// names), so check them against facts we already know about this process.
func TestProcessTableFindsThisProcess(t *testing.T) {
	table, err := processTable()
	if err != nil {
		t.Fatalf("processTable: %v", err)
	}
	self, ok := table[uint32(os.Getpid())]
	if !ok {
		t.Fatalf("did not find our own pid %d in the snapshot of %d processes", os.Getpid(), len(table))
	}
	if want := strings.ToLower(filepath.Base(os.Args[0])); self.Exe != want {
		t.Errorf("our exe = %q, want %q", self.Exe, want)
	}
	if self.PPID != uint32(os.Getppid()) {
		t.Errorf("our ppid = %d, want %d", self.PPID, os.Getppid())
	}
	if self.Created.IsZero() || self.Created.After(time.Now()) {
		t.Errorf("implausible creation time %v", self.Created)
	}
}

// Killing WindowServer ends the login session; killing watchdogd panics the
// machine. This guard is the only thing between a typo in the watchlist and
// either of those.
func TestProtectedProcessesAreNeverKilled(t *testing.T) {
	for _, name := range []string{"launchd", "WindowServer", "/System/Library/CoreServices/loginwindow.app/Contents/MacOS/loginwindow", "watchdogd"} {
		if err := killByExe(name); err == nil {
			t.Errorf("killByExe(%q) returned nil; it must refuse protected processes", name)
		}
	}
}

// A process that is not running is not an error: it is the state we wanted.
func TestKillMissingProcessIsNotAnError(t *testing.T) {
	if err := killByExe("nightcap-definitely-not-running"); err != nil {
		t.Errorf("killByExe on a missing process = %v, want nil", err)
	}
}

func TestIdleTimeIsSane(t *testing.T) {
	d := idleTime()
	if d < 0 {
		t.Fatalf("negative idle time %v", d)
	}
	if d > 72*time.Hour {
		t.Fatalf("implausible idle time %v", d)
	}
}

// Just needs to return without panicking; the value depends on what is on
// screen, so there is nothing to assert about it.
func TestIsFullscreenActiveDoesNotPanic(t *testing.T) {
	_ = isFullscreenActive()
}

// pmset needs no privileges, so unlike the Windows counterpart this should
// succeed in any test environment.
func TestReadAssertions(t *testing.T) {
	asserts, err := readAssertions()
	if err != nil {
		t.Fatalf("readAssertions: %v", err)
	}
	for _, a := range asserts {
		if a.PID <= 0 || a.Type == "" {
			t.Errorf("bogus assertion parsed: %+v", a)
		}
	}
}

func TestLaunchAgentPlistEscapesPath(t *testing.T) {
	got := string(launchAgentPlist(`/Users/w/Apps & Tools/nightcap`))
	if !strings.Contains(got, "<string>/Users/w/Apps &amp; Tools/nightcap</string>") {
		t.Errorf("path not escaped:\n%s", got)
	}
}
