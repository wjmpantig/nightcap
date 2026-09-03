package main

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"os"
	"path/filepath"
)

// setAutostart writes (or removes) a per-user LaunchAgent, the macOS analogue
// of the Windows logon task — minus the elevation problem, since nightcap does
// not need to run privileged here. The plist alone is enough: launchd reads
// LaunchAgents at login, which is exactly when autostart should fire.
func setAutostart(enabled bool) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	path := filepath.Join(home, "Library", "LaunchAgents", "com.nightcap.plist")
	if !enabled {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return err
		}
		return nil
	}
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	return os.WriteFile(path, launchAgentPlist(exe), 0o644)
}

func launchAgentPlist(exe string) []byte {
	// The only interpolated value is a filesystem path; XML-escape it rather
	// than trust that nobody ever installs into a directory with an ampersand.
	var esc bytes.Buffer
	_ = xml.EscapeText(&esc, []byte(exe))
	return fmt.Appendf(nil, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key><string>com.nightcap</string>
	<key>ProgramArguments</key><array><string>%s</string></array>
	<key>RunAtLoad</key><true/>
</dict>
</plist>
`, esc.String())
}
