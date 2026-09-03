package main

import (
	"errors"
	"testing"
	"time"
)

var now = time.Date(2026, 8, 28, 22, 0, 0, 0, time.UTC)

// errSampleFailed stands in for whatever the platform's sampler can return —
// needs-admin on Windows, a pmset failure on macOS. The watcher must treat
// them all the same way: as "I couldn't check", never as an empty list.
var errSampleFailed = errors.New("could not check power requests")

func req(exe string) Request {
	return Request{Category: "SYSTEM", Kind: "PROCESS", Exe: exe, Reason: "Video is playing."}
}

func cfgWith(entries ...WatchEntry) Config {
	c := defaultConfig()
	c.Watchlist = entries
	return c
}

func TestDecide(t *testing.T) {
	vlc := WatchEntry{Exe: "vlc.exe"}

	tests := []struct {
		name string
		snap Snapshot
		cfg  Config
		want []string
	}{
		{
			name: "idle past timeout but nothing watched is holding a request",
			snap: Snapshot{IdleFor: time.Hour, Requests: []Request{req("chrome.exe")}},
			cfg:  cfgWith(vlc),
			want: nil,
		},
		{
			name: "watched and past the global timeout",
			snap: Snapshot{IdleFor: 20 * time.Minute, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(vlc),
			want: []string{"vlc.exe"},
		},
		{
			name: "watched but not idle long enough",
			snap: Snapshot{IdleFor: 5 * time.Minute, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(vlc),
			want: nil,
		},
		{
			name: "per-app override beats the global default",
			snap: Snapshot{IdleFor: 2 * time.Minute, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(WatchEntry{Exe: "vlc.exe", TimeoutMinutes: 1}),
			want: []string{"vlc.exe"},
		},
		{
			name: "per-app override can also be longer than the global default",
			snap: Snapshot{IdleFor: 20 * time.Minute, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(WatchEntry{Exe: "vlc.exe", TimeoutMinutes: 60}),
			want: nil,
		},
		{
			name: "fullscreen does not save a watched app: watchlist wins",
			snap: Snapshot{IdleFor: time.Hour, Fullscreen: true, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(vlc),
			want: []string{"vlc.exe"},
		},
		{
			name: "fullscreen app that is not watched is left alone",
			snap: Snapshot{IdleFor: time.Hour, Fullscreen: true, Requests: []Request{req("mpv.exe")}},
			cfg:  cfgWith(vlc),
			want: nil,
		},
		{
			name: "snoozed app is spared even well past its timeout",
			snap: Snapshot{IdleFor: time.Hour, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(WatchEntry{Exe: "vlc.exe", SnoozedUntil: now.Add(30 * time.Minute)}),
			want: nil,
		},
		{
			name: "expired snooze no longer protects it",
			snap: Snapshot{IdleFor: time.Hour, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(WatchEntry{Exe: "vlc.exe", SnoozedUntil: now.Add(-time.Minute)}),
			want: []string{"vlc.exe"},
		},
		{
			name: "a snoozed app does not lend its fullscreen exemption to others",
			snap: Snapshot{IdleFor: time.Hour, Fullscreen: true, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(WatchEntry{Exe: "vlc.exe", SnoozedUntil: now.Add(time.Hour)}),
			want: nil,
		},
		{
			name: "driver requests have no exe and are never killed",
			snap: Snapshot{IdleFor: time.Hour, Requests: []Request{{Category: "SYSTEM", Kind: "DRIVER", Path: "Realtek Audio"}}},
			cfg:  cfgWith(vlc),
			want: nil,
		},
		{
			name: "paused means nothing is ever killed",
			snap: Snapshot{IdleFor: time.Hour, Requests: []Request{req("vlc.exe")}},
			cfg: func() Config {
				c := cfgWith(vlc)
				c.Paused = true
				return c
			}(),
			want: nil,
		},
		{
			name: "two watched holders both come due",
			snap: Snapshot{IdleFor: time.Hour, Requests: []Request{req("vlc.exe"), req("steam.exe")}},
			cfg:  cfgWith(vlc, WatchEntry{Exe: "steam.exe"}),
			want: []string{"steam.exe", "vlc.exe"},
		},
		{
			name: "the same app holding several requests is only listed once",
			snap: Snapshot{IdleFor: time.Hour, Requests: []Request{req("vlc.exe"), {Category: "DISPLAY", Kind: "PROCESS", Exe: "vlc.exe"}}},
			cfg:  cfgWith(vlc),
			want: []string{"vlc.exe"},
		},
		{
			name: "idle exactly at the timeout counts as due",
			snap: Snapshot{IdleFor: 15 * time.Minute, Requests: []Request{req("vlc.exe")}},
			cfg:  cfgWith(vlc),
			want: []string{"vlc.exe"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := decide(now, tt.snap, sanitize(tt.cfg))
			if !equal(got, tt.want) {
				t.Fatalf("decide() = %v, want %v", got, tt.want)
			}
		})
	}
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// The countdown must not fire early, must fire once the warning has elapsed,
// and must be abandoned if the machine wakes up in the meantime.
func TestWarningCountdown(t *testing.T) {
	s := &store{cfg: sanitize(cfgWith(WatchEntry{Exe: "vlc.exe", TimeoutMinutes: 1}))}
	clock := now
	busy := Snapshot{IdleFor: 0, Requests: []Request{req("vlc.exe")}}
	idle := Snapshot{IdleFor: 10 * time.Minute, Requests: []Request{req("vlc.exe")}}
	snap := idle

	var killed []string
	w := newWatcher(s)
	w.now = func() time.Time { return clock }
	w.sample = func() (Snapshot, error) { return snap, nil }
	w.kill = func(exe string) error { killed = append(killed, exe); return nil }

	w.tick() // first sighting: starts a 30s countdown, kills nothing
	if len(killed) != 0 {
		t.Fatalf("killed during the warning window: %v", killed)
	}
	if len(w.status().Pending) != 1 {
		t.Fatalf("expected a pending countdown, got %v", w.status().Pending)
	}

	clock = clock.Add(10 * time.Second)
	w.tick()
	if len(killed) != 0 {
		t.Fatalf("killed before the warning elapsed: %v", killed)
	}

	// User comes back mid-countdown: the countdown must be dropped, not resumed.
	snap = busy
	w.tick()
	if len(w.status().Pending) != 0 {
		t.Fatalf("countdown survived the user returning: %v", w.status().Pending)
	}

	// Idle again: a fresh countdown starts, so the old deadline must not apply.
	snap = idle
	clock = clock.Add(time.Minute)
	w.tick()
	if len(killed) != 0 {
		t.Fatalf("reused a stale deadline: %v", killed)
	}

	clock = clock.Add(31 * time.Second)
	w.tick()
	if !equal(killed, []string{"vlc.exe"}) {
		t.Fatalf("expected vlc.exe to be killed, got %v", killed)
	}
}

// A failing query must surface as an error, never as "nothing is keeping you awake".
func TestSampleErrorIsNotAnEmptyList(t *testing.T) {
	s := &store{cfg: sanitize(cfgWith(WatchEntry{Exe: "vlc.exe"}))}
	var killed []string
	w := newWatcher(s)
	w.now = func() time.Time { return now }
	w.sample = func() (Snapshot, error) { return Snapshot{}, errSampleFailed }
	w.kill = func(exe string) error { killed = append(killed, exe); return nil }

	w.tick()
	if w.status().Error == "" {
		t.Fatal("expected an error in the status")
	}
	if len(killed) != 0 {
		t.Fatalf("killed something off a failed query: %v", killed)
	}
}
