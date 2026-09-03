package main

import (
	"testing"
	"time"
)

// Real `pmset -g assertions` output shape: a timestamp, the system-wide
// summary table, then the per-process list. coreaudiod holds audio assertions
// on the playing app's behalf and says so with a "Created for PID:" line;
// powerd's Internal* housekeeping and UserIsActive must not read as apps
// keeping the machine awake.
const pmsetFixture = `2026-09-03 12:00:00 +0200
Assertion status system-wide:
   BackgroundTask                 0
   ApplePushServiceTask           0
   UserIsActive                   1
   PreventUserIdleDisplaySleep    1
   PreventSystemSleep             0
   ExternalMedia                  0
   PreventUserIdleSystemSleep     1
   NetworkClientActive            0
Listed by owning process:
  pid 214(coreaudiod): [0x0000162d00098765] 00:31:24 PreventUserIdleSystemSleep named: "com.apple.audio.context.preventuseridlesleep"
	Created for PID: 4130.
  pid 4130(Music): [0x0000163e000a1234] 00:05:12 PreventUserIdleDisplaySleep named: "com.apple.Music.playback"
  pid 8891(Google Chrome Helper (Renderer)): [0x0000163f000b0001] 01:02:03 PreventUserIdleDisplaySleep named: "Video Wake Lock"
  pid 138(powerd): [0x0000000c00098000] 00:00:08 InternalPreventDisplaySleep named: "com.apple.powermanagement.delayDisplayOff"
	Timeout will fire in 8 secs Action=TimeoutActionTurnOff
  pid 160(hidd): [0x0000000d00000001] 00:00:01 UserIsActive named: "com.apple.iohideventsystem.queue.tickle"
No kernel assertions.
`

func TestParsePmset(t *testing.T) {
	got := parsePmset(pmsetFixture)

	want := []assertion{
		{PID: 214, Name: "coreaudiod", Type: "PreventUserIdleSystemSleep",
			Reason: "com.apple.audio.context.preventuseridlesleep", CreatedForPID: 4130},
		{PID: 4130, Name: "Music", Type: "PreventUserIdleDisplaySleep",
			Reason: "com.apple.Music.playback"},
		{PID: 8891, Name: "Google Chrome Helper (Renderer)", Type: "PreventUserIdleDisplaySleep",
			Reason: "Video Wake Lock"},
		{PID: 138, Name: "powerd", Type: "InternalPreventDisplaySleep",
			Reason: "com.apple.powermanagement.delayDisplayOff"},
		{PID: 160, Name: "hidd", Type: "UserIsActive",
			Reason: "com.apple.iohideventsystem.queue.tickle"},
	}
	if len(got) != len(want) {
		t.Fatalf("parsed %d assertions, want %d: %+v", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("assertion %d = %+v, want %+v", i, got[i], want[i])
		}
	}
}

func TestParsePmsetEmpty(t *testing.T) {
	out := "2026-09-03 12:00:00 +0200\nAssertion status system-wide:\n   PreventUserIdleSystemSleep     0\nNo kernel assertions.\n"
	if got := parsePmset(out); len(got) != 0 {
		t.Fatalf("expected no assertions, got %+v", got)
	}
}

// The summary table must never become phantom requesters, and a stray
// "Created for PID" with nothing above it must not panic.
func TestParsePmsetIgnoresNoise(t *testing.T) {
	if got := parsePmset("   PreventUserIdleDisplaySleep    1\n\tCreated for PID: 99.\n"); len(got) != 0 {
		t.Fatalf("noise parsed as assertions: %+v", got)
	}
}

func TestAssertionRequests(t *testing.T) {
	table := map[uint32]procInfo{
		4130: {PID: 4130, Exe: "music", Created: time.Now()},
		8891: {PID: 8891, PPID: 8800, Exe: "google chrome helper (renderer)"},
		8800: {PID: 8800, Exe: "google chrome"},
	}
	got := assertionRequests(parsePmset(pmsetFixture), table)

	want := []Request{
		// coreaudiod's assertion is attributed to the app it fronts for.
		{Category: "SYSTEM", Kind: "PROCESS", Exe: "music",
			Path: "pid 214 (coreaudiod)", Reason: "com.apple.audio.context.preventuseridlesleep"},
		{Category: "DISPLAY", Kind: "PROCESS", Exe: "music",
			Path: "pid 4130 (Music)", Reason: "com.apple.Music.playback"},
		{Category: "DISPLAY", Kind: "PROCESS", Exe: "google chrome helper (renderer)",
			Path: "pid 8891 (Google Chrome Helper (Renderer))", Reason: "Video Wake Lock"},
		// powerd's internal timer and hidd's activity tickle are not requests.
	}
	if len(got) != len(want) {
		t.Fatalf("got %d requests, want %d: %+v", len(got), len(want), got)
	}
	for i := range want {
		if got[i].Category != want[i].Category || got[i].Kind != want[i].Kind ||
			got[i].Exe != want[i].Exe || got[i].Path != want[i].Path || got[i].Reason != want[i].Reason {
			t.Errorf("request %d = %+v, want %+v", i, got[i], want[i])
		}
	}
}

// A proxied assertion whose app has already exited must stay visible but
// unkillable — empty exe, like a Windows driver — not fall back to blaming
// the daemon that fronted it.
func TestAssertionRequestsDeadCreatedFor(t *testing.T) {
	asserts := []assertion{{PID: 214, Name: "coreaudiod", Type: "PreventUserIdleSystemSleep", CreatedForPID: 9999}}
	got := assertionRequests(asserts, map[uint32]procInfo{})
	if len(got) != 1 || got[0].Exe != "" {
		t.Fatalf("dead created-for pid should yield an unkillable request, got %+v", got)
	}
}

// Without a process table (it can fail), pmset's own truncated name is still
// better than nothing.
func TestAssertionRequestsNoTable(t *testing.T) {
	asserts := []assertion{{PID: 4130, Name: "Music", Type: "PreventUserIdleDisplaySleep"}}
	got := assertionRequests(asserts, nil)
	if len(got) != 1 || got[0].Exe != "music" {
		t.Fatalf("expected fallback to pmset's name, got %+v", got)
	}
}
