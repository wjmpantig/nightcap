package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Request is a single power request reported by the OS: something asking the
// machine to stay awake.
type Request struct {
	Category string `json:"category"` // DISPLAY | SYSTEM | AWAYMODE | EXECUTION | PERFBOOST | ACTIVELOCKSCREEN
	Kind     string `json:"kind"`     // PROCESS | DRIVER | SERVICE
	Exe      string `json:"exe"`      // lowercased basename, "" for drivers/services
	Path     string `json:"path"`     // raw requester string as reported
	Reason   string `json:"reason"`   // e.g. "Video is playing."
	// Hosts is the app(s) owning Exe when Exe is a shared runtime such as
	// msedgewebview2.exe. powercfg reports no PID, so several owners here means
	// the holder genuinely cannot be pinned down.
	Hosts []string `json:"hosts"`
}

// WatchEntry is one app the user has asked us to police.
type WatchEntry struct {
	Exe            string    `json:"exe"`            // match key, lowercased basename
	TimeoutMinutes int       `json:"timeoutMinutes"` // 0 = use the global default
	SnoozedUntil   time.Time `json:"snoozedUntil"`   // zero = not snoozed
}

// Snoozed reports whether this entry is currently paused.
func (w WatchEntry) Snoozed(now time.Time) bool {
	return now.Before(w.SnoozedUntil)
}

// Timeout resolves the entry's idle timeout against the global default.
func (w WatchEntry) Timeout(cfg Config) time.Duration {
	m := w.TimeoutMinutes
	if m <= 0 {
		m = cfg.DefaultTimeoutMinutes
	}
	if m <= 0 {
		m = defaultTimeoutMinutes
	}
	return time.Duration(m) * time.Minute
}

// KillRecord is one app nightcap closed, kept so you can find out what died
// overnight.
type KillRecord struct {
	Exe      string    `json:"exe"`
	At       time.Time `json:"at"`
	IdleSecs int       `json:"idleSecs"`
	Category string    `json:"category"` // the request type it was holding
	Reason   string    `json:"reason"`   // the app's own stated reason, if any
}

type Config struct {
	DefaultTimeoutMinutes int          `json:"defaultTimeoutMinutes"`
	WarningSeconds        int          `json:"warningSeconds"`
	Watchlist             []WatchEntry `json:"watchlist"`
	Autostart             bool         `json:"autostart"`
	Paused                bool         `json:"paused"`
	History               []KillRecord `json:"history"` // newest first
}

const (
	defaultTimeoutMinutes = 15
	defaultWarningSeconds = 30
	// historyLimit bounds the config file. Old kills are not worth unbounded
	// growth in a file we rewrite on every settings change.
	historyLimit = 200
)

func defaultConfig() Config {
	return Config{
		DefaultTimeoutMinutes: defaultTimeoutMinutes,
		WarningSeconds:        defaultWarningSeconds,
		Watchlist:             []WatchEntry{},
		History:               []KillRecord{},
	}
}

// find returns a pointer to the entry for exe, or nil.
func (c *Config) find(exe string) *WatchEntry {
	exe = normalizeExe(exe)
	for i := range c.Watchlist {
		if c.Watchlist[i].Exe == exe {
			return &c.Watchlist[i]
		}
	}
	return nil
}

func normalizeExe(s string) string {
	s = strings.TrimSpace(s)
	// Accept a full path (NT or DOS) and reduce it to a basename.
	if i := strings.LastIndexAny(s, `\/`); i >= 0 {
		s = s[i+1:]
	}
	return strings.ToLower(s)
}

// store is the on-disk config, guarded for concurrent access between the
// watcher goroutine and UI-bound methods.
type store struct {
	mu   sync.RWMutex
	cfg  Config
	path string
	// warn is a non-fatal load problem worth showing the user (corrupt file).
	warn string
}

func configPath() (string, error) {
	dir, err := os.UserConfigDir() // %APPDATA% on Windows
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "nightcap", "config.json"), nil
}

func loadStore() *store {
	s := &store{cfg: defaultConfig()}
	p, err := configPath()
	if err != nil {
		s.warn = "could not locate config directory: " + err.Error()
		return s
	}
	s.path = p

	b, err := os.ReadFile(p)
	if errors.Is(err, os.ErrNotExist) {
		return s // first run
	}
	if err != nil {
		s.warn = "could not read config, using defaults: " + err.Error()
		return s
	}

	var cfg Config
	if err := json.Unmarshal(b, &cfg); err != nil {
		// Never die on a corrupt config; keep a copy so it isn't silently lost.
		_ = os.WriteFile(p+".bad", b, 0o600)
		s.warn = fmt.Sprintf("config was unreadable and has been reset (old copy saved to %s.bad)", filepath.Base(p))
		return s
	}
	s.cfg = sanitize(cfg)
	return s
}

// sanitize fills in anything missing or nonsensical from a hand-edited file.
func sanitize(c Config) Config {
	if c.DefaultTimeoutMinutes <= 0 {
		c.DefaultTimeoutMinutes = defaultTimeoutMinutes
	}
	if c.WarningSeconds < 0 {
		c.WarningSeconds = defaultWarningSeconds
	}
	if c.Watchlist == nil {
		c.Watchlist = []WatchEntry{}
	}
	out := c.Watchlist[:0]
	seen := map[string]bool{}
	for _, e := range c.Watchlist {
		e.Exe = normalizeExe(e.Exe)
		if e.Exe == "" || seen[e.Exe] {
			continue
		}
		seen[e.Exe] = true
		if e.TimeoutMinutes < 0 {
			e.TimeoutMinutes = 0
		}
		out = append(out, e)
	}
	c.Watchlist = out

	if c.History == nil {
		c.History = []KillRecord{}
	}
	if len(c.History) > historyLimit {
		c.History = c.History[:historyLimit]
	}
	return c
}

func (s *store) get() Config {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.cfg
}

// update applies fn to the config under lock and persists the result.
func (s *store) update(fn func(*Config)) error {
	s.mu.Lock()
	fn(&s.cfg)
	s.cfg = sanitize(s.cfg)
	cfg := s.cfg
	path := s.path
	s.mu.Unlock()

	if path == "" {
		return errors.New("no config path")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	b, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, b, 0o600)
}

// jsonUnmarshalInto exists so tests can reload a config exactly the way
// loadStore does without reaching into the user's real config directory.
func jsonUnmarshalInto(b []byte, c *Config) error { return json.Unmarshal(b, c) }
