package main

import (
	"bytes"
	"testing"
)

// The tray's whole promise is that a lit mark means something is holding this
// machine awake. Pin it: paused, blind and settled all have to read as dim, or
// the icon is telling the user something that isn't true.
func TestTrayIcon(t *testing.T) {
	cases := []struct {
		name string
		st   trayState
		lit  bool
	}{
		{"something awake", trayState{awake: 2}, true},
		{"one thing awake", trayState{awake: 1}, true},
		{"nothing awake", trayState{}, false},
		{"paused with things awake", trayState{paused: true, awake: 3}, false},
		{"query failed", trayState{blind: true}, false},
		// A failed query leaves the previous count behind; not knowing beats a
		// stale "2 things are awake".
		{"query failed with a stale count", trayState{blind: true, awake: 2}, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := trayIcon(tc.st)
			if lit := bytes.Equal(got, trayActive); lit != tc.lit {
				t.Errorf("trayIcon(%+v) lit = %v, want %v", tc.st, lit, tc.lit)
			}
		})
	}
}

// The icon cannot separate paused from settled from blind, so the tooltip must.
func TestTrayTooltip(t *testing.T) {
	cases := []struct {
		st   trayState
		want string
	}{
		{trayState{paused: true}, "nightcap — paused"},
		{trayState{paused: true, awake: 2}, "nightcap — paused"},
		{trayState{blind: true}, "nightcap — cannot read the power requests"},
		{trayState{}, "nightcap — watching, nothing is awake"},
		{trayState{awake: 1}, "nightcap — 1 thing is keeping this machine awake"},
		{trayState{awake: 4}, "nightcap — 4 things are keeping this machine awake"},
	}
	for _, tc := range cases {
		if got := trayTooltip(tc.st); got != tc.want {
			t.Errorf("trayTooltip(%+v) = %q, want %q", tc.st, got, tc.want)
		}
	}
}
