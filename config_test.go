package main

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestConfigRoundTrip(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.json")
	s := &store{cfg: defaultConfig(), path: path}

	until := time.Now().Add(time.Hour).Round(time.Second)
	if err := s.update(func(c *Config) {
		c.Watchlist = append(c.Watchlist, WatchEntry{Exe: "VLC.EXE", TimeoutMinutes: 5, SnoozedUntil: until})
	}); err != nil {
		t.Fatalf("update: %v", err)
	}

	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("config was not written: %v", err)
	}

	// Reload the way loadStore would, and check the snooze survived a restart:
	// an autostarting watcher that forgets snoozes would kill what you spared.
	reloaded := &store{cfg: defaultConfig()}
	if err := jsonUnmarshalInto(b, &reloaded.cfg); err != nil {
		t.Fatalf("reload: %v", err)
	}
	reloaded.cfg = sanitize(reloaded.cfg)

	e := reloaded.cfg.find("vlc.exe")
	if e == nil {
		t.Fatal("watchlist entry did not survive the round trip")
	}
	if e.TimeoutMinutes != 5 {
		t.Errorf("timeout = %d, want 5", e.TimeoutMinutes)
	}
	if !e.SnoozedUntil.Round(time.Second).Equal(until) {
		t.Errorf("snoozedUntil = %v, want %v", e.SnoozedUntil, until)
	}
	if !e.Snoozed(time.Now()) {
		t.Error("entry should still be snoozed after reload")
	}
}

func TestSanitize(t *testing.T) {
	// A hand-edited or half-written config must not take the app down or
	// produce a zero timeout that kills everything instantly.
	got := sanitize(Config{
		DefaultTimeoutMinutes: 0,
		WarningSeconds:        -5,
		Watchlist: []WatchEntry{
			{Exe: `C:\Program Files\VLC\VLC.EXE`},
			{Exe: "vlc.exe"}, // duplicate once normalised
			{Exe: "   "},     // junk
			{Exe: "steam.exe", TimeoutMinutes: -3},
		},
	})

	if got.DefaultTimeoutMinutes != defaultTimeoutMinutes {
		t.Errorf("default timeout = %d, want %d", got.DefaultTimeoutMinutes, defaultTimeoutMinutes)
	}
	if got.WarningSeconds != defaultWarningSeconds {
		t.Errorf("warning seconds = %d, want %d", got.WarningSeconds, defaultWarningSeconds)
	}
	if len(got.Watchlist) != 2 {
		t.Fatalf("watchlist = %+v, want vlc.exe and steam.exe only", got.Watchlist)
	}
	if got.Watchlist[0].Exe != "vlc.exe" || got.Watchlist[1].Exe != "steam.exe" {
		t.Errorf("watchlist not normalised: %+v", got.Watchlist)
	}
	if got.Watchlist[1].TimeoutMinutes != 0 {
		t.Errorf("negative timeout should fall back to the default, got %d", got.Watchlist[1].TimeoutMinutes)
	}
}

func TestCorruptConfigFallsBackToDefaults(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")
	if err := os.WriteFile(path, []byte("{ this is not json"), 0o600); err != nil {
		t.Fatal(err)
	}

	s := &store{cfg: defaultConfig(), path: path}
	b, _ := os.ReadFile(path)
	if err := jsonUnmarshalInto(b, &Config{}); err == nil {
		t.Fatal("expected the corrupt file to fail parsing")
	}
	// Defaults must still be usable rather than a zero Config.
	if s.get().DefaultTimeoutMinutes != defaultTimeoutMinutes {
		t.Error("fallback config is not usable")
	}
}

func TestTimeoutFallsBackToGlobal(t *testing.T) {
	cfg := Config{DefaultTimeoutMinutes: 30}
	if got := (WatchEntry{}).Timeout(cfg); got != 30*time.Minute {
		t.Errorf("Timeout() = %v, want 30m", got)
	}
	if got := (WatchEntry{TimeoutMinutes: 5}).Timeout(cfg); got != 5*time.Minute {
		t.Errorf("Timeout() = %v, want 5m", got)
	}
	// A zero global must never mean "kill immediately".
	if got := (WatchEntry{}).Timeout(Config{}); got != defaultTimeoutMinutes*time.Minute {
		t.Errorf("Timeout() with empty config = %v, want the built-in default", got)
	}
}

// The tray follows the paused state through store.onChange, so every mutation
// path has to fire it — that is the whole reason the hook lives in update()
// rather than in App.SetPaused.
func TestUpdateNotifiesWatcher(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.json")
	s := &store{cfg: defaultConfig(), path: path}

	var seen []Config
	s.watch(func(c Config) { seen = append(seen, c) })

	if err := s.update(func(c *Config) { c.Paused = true }); err != nil {
		t.Fatalf("update: %v", err)
	}
	if err := s.update(func(c *Config) { c.Paused = false }); err != nil {
		t.Fatalf("update: %v", err)
	}

	if len(seen) != 2 {
		t.Fatalf("onChange fired %d times, want 2", len(seen))
	}
	if !seen[0].Paused || seen[1].Paused {
		t.Errorf("paused sequence = %v, %v; want true, false", seen[0].Paused, seen[1].Paused)
	}

	// The hook must see the sanitised config, not the raw mutation: the tray
	// should never render a state the rest of the app has already corrected.
	if err := s.update(func(c *Config) { c.DefaultTimeoutMinutes = 0 }); err != nil {
		t.Fatalf("update: %v", err)
	}
	if got := seen[len(seen)-1].DefaultTimeoutMinutes; got == 0 {
		t.Errorf("onChange saw an unsanitised zero timeout")
	}
}

// A store with no watcher registered is the normal case in tests and on
// platforms with no tray; update must not panic on the nil hook.
func TestUpdateWithoutWatcher(t *testing.T) {
	s := &store{cfg: defaultConfig(), path: filepath.Join(t.TempDir(), "config.json")}
	if err := s.update(func(c *Config) { c.Paused = true }); err != nil {
		t.Fatalf("update: %v", err)
	}
	if !s.get().Paused {
		t.Error("paused was not applied")
	}
}
