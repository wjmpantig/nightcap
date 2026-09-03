package main

import (
	"testing"
	"time"
)

func TestKillIsRecordedInHistory(t *testing.T) {
	s := &store{cfg: sanitize(cfgWith(WatchEntry{Exe: "vlc.exe", TimeoutMinutes: 1}))}
	clock := now
	w := newWatcher(s)
	w.now = func() time.Time { return clock }
	w.sample = func() (Snapshot, error) {
		return Snapshot{IdleFor: 10 * time.Minute, Requests: []Request{req("vlc.exe")}}, nil
	}
	w.kill = func(string) error { return nil }

	w.tick() // starts the warning
	if len(s.get().History) != 0 {
		t.Fatal("recorded a kill during the warning window")
	}

	clock = clock.Add(time.Minute)
	w.tick() // warning elapsed: kill

	h := s.get().History
	if len(h) != 1 {
		t.Fatalf("history = %+v, want exactly one record", h)
	}
	if h[0].Exe != "vlc.exe" {
		t.Errorf("exe = %q, want vlc.exe", h[0].Exe)
	}
	if !h[0].At.Equal(clock) {
		t.Errorf("at = %v, want %v", h[0].At, clock)
	}
	if h[0].IdleSecs != 600 {
		t.Errorf("idleSecs = %d, want 600", h[0].IdleSecs)
	}
	// The app's own explanation is the useful part of the record.
	if h[0].Category != "SYSTEM" || h[0].Reason != "Video is playing." {
		t.Errorf("lost the request context: %+v", h[0])
	}
}

// A kill that fails is not a kill and must not appear in the history.
func TestFailedKillIsNotRecorded(t *testing.T) {
	s := &store{cfg: sanitize(cfgWith(WatchEntry{Exe: "vlc.exe", TimeoutMinutes: 1}))}
	clock := now
	w := newWatcher(s)
	w.now = func() time.Time { return clock }
	w.sample = func() (Snapshot, error) {
		return Snapshot{IdleFor: 10 * time.Minute, Requests: []Request{req("vlc.exe")}}, nil
	}
	w.kill = func(string) error { return errSampleFailed }

	w.tick()
	clock = clock.Add(time.Minute)
	w.tick()

	if h := s.get().History; len(h) != 0 {
		t.Fatalf("history = %+v, want empty after a failed kill", h)
	}
	if w.status().Error == "" {
		t.Error("a failed kill should surface an error")
	}
}

func TestHistoryIsNewestFirstAndBounded(t *testing.T) {
	s := &store{cfg: defaultConfig()}
	w := newWatcher(s)

	for i := 0; i < historyLimit+50; i++ {
		w.record(KillRecord{Exe: "vlc.exe", At: now.Add(time.Duration(i) * time.Minute)})
	}

	h := s.get().History
	if len(h) != historyLimit {
		t.Fatalf("history length = %d, want it capped at %d", len(h), historyLimit)
	}
	// Newest first: the last one recorded must be at the top, and the oldest
	// must be the entry that got trimmed away.
	newest := now.Add(time.Duration(historyLimit+49) * time.Minute)
	if !h[0].At.Equal(newest) {
		t.Errorf("h[0].At = %v, want the most recent kill %v", h[0].At, newest)
	}
	if !h[0].At.After(h[1].At) {
		t.Error("history is not ordered newest first")
	}
}

func TestClearHistory(t *testing.T) {
	s := &store{cfg: defaultConfig()}
	app := &App{store: s, watcher: newWatcher(s)}
	app.watcher.record(KillRecord{Exe: "vlc.exe", At: now})

	if len(s.get().History) != 1 {
		t.Fatal("setup failed: nothing recorded")
	}
	if err := app.ClearHistory(); err != nil && s.path != "" {
		t.Fatalf("ClearHistory: %v", err)
	}
	if h := s.get().History; len(h) != 0 {
		t.Fatalf("history = %+v, want empty after clearing", h)
	}
	// Clearing history must not disturb anything else in the config.
	if s.get().DefaultTimeoutMinutes != defaultTimeoutMinutes {
		t.Error("ClearHistory damaged the rest of the config")
	}
}
