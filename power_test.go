package main

import (
	"strings"
	"testing"
)

// Real `powercfg /requests` output shape: every category is always printed,
// empty ones say "None.", and a requester may or may not be followed by a
// free-text reason line. Windows emits CRLF, so the fixture does too.
var powercfgFixture = strings.ReplaceAll(`DISPLAY:
None.

SYSTEM:
[DRIVER] Realtek(R) Audio (HDAUDIO\FUNC_01&VEN_10EC&DEV_0257)
An audio stream is currently in use.
[PROCESS] \Device\HarddiskVolume3\Program Files\VideoLAN\VLC\vlc.exe
Video is playing.
[PROCESS] \Device\HarddiskVolume3\Users\w\AppData\Local\Steam\steam.exe

AWAYMODE:
None.

EXECUTION:
[SERVICE] \Device\HarddiskVolume3\Windows\System32\svchost.exe (wuauserv)
Windows Update needs to keep the machine awake.

PERFBOOST:
None.

ACTIVELOCKSCREEN:
None.
`, "\n", "\r\n")

func TestParsePowercfg(t *testing.T) {
	got := parsePowercfg(powercfgFixture)

	want := []Request{
		{Category: "SYSTEM", Kind: "DRIVER", Exe: "", Reason: "An audio stream is currently in use."},
		{Category: "SYSTEM", Kind: "PROCESS", Exe: "vlc.exe", Reason: "Video is playing."},
		{Category: "SYSTEM", Kind: "PROCESS", Exe: "steam.exe", Reason: ""},
		{Category: "EXECUTION", Kind: "SERVICE", Exe: "", Reason: "Windows Update needs to keep the machine awake."},
	}

	if len(got) != len(want) {
		t.Fatalf("parsed %d requests, want %d: %+v", len(got), len(want), got)
	}
	for i := range want {
		if got[i].Category != want[i].Category || got[i].Kind != want[i].Kind ||
			got[i].Exe != want[i].Exe || got[i].Reason != want[i].Reason {
			t.Errorf("request %d = %+v, want %+v", i, got[i], want[i])
		}
	}

	// "None." must never become a phantom requester.
	for _, r := range got {
		if r.Path == "None." || r.Kind == "" {
			t.Errorf("bogus request parsed: %+v", r)
		}
	}
}

func TestParsePowercfgEmpty(t *testing.T) {
	out := "DISPLAY:\r\nNone.\r\n\r\nSYSTEM:\r\nNone.\r\n"
	if got := parsePowercfg(out); len(got) != 0 {
		t.Fatalf("expected no requests, got %+v", got)
	}
}

// A service or driver holding the lock is not something we can kill, so it must
// never yield an exe for decide() to match against.
func TestOnlyProcessesYieldAnExe(t *testing.T) {
	if got := exeFromRequester("SERVICE", `\Device\HarddiskVolume3\Windows\System32\svchost.exe (wuauserv)`); got != "" {
		t.Errorf("service yielded exe %q, want empty", got)
	}
	if got := exeFromRequester("DRIVER", "Realtek(R) Audio"); got != "" {
		t.Errorf("driver yielded exe %q, want empty", got)
	}
	if got := exeFromRequester("PROCESS", `\Device\HarddiskVolume3\Program Files\VideoLAN\VLC\VLC.exe`); got != "vlc.exe" {
		t.Errorf("process yielded exe %q, want vlc.exe", got)
	}
}

func TestNormalizeExe(t *testing.T) {
	for in, want := range map[string]string{
		`\Device\HarddiskVolume3\Program Files\VLC\vlc.exe`: "vlc.exe",
		`C:\Program Files\VLC\VLC.EXE`:                      "vlc.exe",
		"  Steam.exe  ":                                     "steam.exe",
		"vlc.exe":                                           "vlc.exe",
	} {
		if got := normalizeExe(in); got != want {
			t.Errorf("normalizeExe(%q) = %q, want %q", in, got, want)
		}
	}
}
