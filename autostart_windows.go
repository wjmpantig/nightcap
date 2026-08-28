package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	"golang.org/x/sys/windows"
)

const taskName = "nightcap"

// setAutostart registers (or removes) a logon task.
//
// An HKCU\...\Run entry is the usual way to do this, but it cannot launch an
// elevated app: Windows silently refuses rather than showing a UAC prompt at
// login. A scheduled task with /rl HIGHEST is the only way to start elevated
// without prompting on every boot.
func setAutostart(enabled bool) error {
	if !enabled {
		return runHidden("schtasks", "/delete", "/tn", taskName, "/f")
	}
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	return runHidden("schtasks", "/create",
		"/tn", taskName,
		"/tr", `"`+exe+`"`,
		"/sc", "onlogon",
		"/rl", "HIGHEST",
		"/f",
	)
}

func runHidden(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &windows.SysProcAttr{HideWindow: true}
	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("%s: %s", name, strings.TrimSpace(string(out)))
	}
	return nil
}
