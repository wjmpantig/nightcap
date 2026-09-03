package main

import (
	"bytes"
	"encoding/binary"
	"encoding/xml"
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"
	"unicode/utf16"

	"golang.org/x/sys/windows"
)

const taskName = "nightcap"

// taskXML is the logon task, registered with `schtasks /xml`.
//
// An HKCU\...\Run entry is the usual way to do this, but it cannot launch an
// elevated app: Windows silently refuses rather than showing a UAC prompt at
// login. Only a scheduled task with HighestAvailable starts elevated without
// prompting on every boot.
//
// The XML exists because three of schtasks' /create defaults are wrong for a
// watcher that has to stay running:
//
//   - DisallowStartIfOnBatteries — a laptop on battery never starts the task,
//     which is exactly the machine most likely to be left awake in a bag.
//   - StopIfGoingOnBatteries — unplugging kills the watcher.
//   - ExecutionTimeLimit, 72h by default — nightcap is killed after three days.
//
// None of the three has a /create flag; PT0S means no limit.
const taskXML = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>Starts nightcap at logon.</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
      <UserId>%[1]s</UserId>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <UserId>%[1]s</UserId>
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>%[2]s</Command>
      <WorkingDirectory>%[3]s</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
`

// autostartEnabled asks Windows rather than the config file. The two drift: the
// task can be removed from Task Scheduler, or point at an executable that has
// since moved, neither of which the config would ever hear about.
func autostartEnabled() bool {
	return runHidden("schtasks", "/query", "/tn", taskName) == nil
}

// setAutostart registers (or removes) the logon task.
func setAutostart(enabled bool) error {
	if !enabled {
		if !autostartEnabled() {
			return nil // deleting a task that isn't there is not a failure
		}
		return runHidden("schtasks", "/delete", "/tn", taskName, "/f")
	}

	exe, err := os.Executable()
	if err != nil {
		return err
	}
	who, err := user.Current()
	if err != nil {
		return err
	}

	f, err := os.CreateTemp("", "nightcap-task-*.xml")
	if err != nil {
		return err
	}
	defer os.Remove(f.Name())
	body := fmt.Sprintf(taskXML, esc(who.Username), esc(exe), esc(filepath.Dir(exe)))
	// schtasks reads the file as UTF-16 whatever the declared encoding says.
	_, err = f.Write(utf16le(body))
	if cerr := f.Close(); err == nil {
		err = cerr
	}
	if err != nil {
		return err
	}

	return runHidden("schtasks", "/create", "/tn", taskName, "/xml", f.Name(), "/f")
}

func esc(s string) string {
	var b bytes.Buffer
	_ = xml.EscapeText(&b, []byte(s))
	return b.String()
}

func utf16le(s string) []byte {
	var b bytes.Buffer
	b.Write([]byte{0xff, 0xfe}) // BOM
	for _, r := range utf16.Encode([]rune(s)) {
		_ = binary.Write(&b, binary.LittleEndian, r)
	}
	return b.Bytes()
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
