package main

import (
	"context"
	"time"
)

// version is the release tag, stamped in by the build:
//
//	wails build -ldflags "-X main.version=v1.2.3"
//
// A local `wails build` leaves it "dev", which is the honest answer for a
// binary that came from a working tree rather than a tag.
var version = "dev"

// App is the API bound into the frontend.
type App struct {
	ctx     context.Context
	store   *store
	watcher *watcher
}

func NewApp() *App {
	s := loadStore()
	// The config's copy of Autostart is a cache: the task can be deleted from
	// Task Scheduler, or survive an uninstall, without nightcap hearing about
	// it. Ask Windows once at startup so the checkbox never lies.
	if on := autostartEnabled(); s.get().Autostart != on {
		_ = s.update(func(c *Config) { c.Autostart = on })
	}
	return &App{store: s, watcher: newWatcher(s)}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	go a.watcher.run(ctx)
}

// GetStatus returns the most recent poll result. The frontend also receives
// this as a "status" event on every tick; this is for the initial render.
func (a *App) GetStatus() Status { return a.watcher.status() }

func (a *App) GetConfig() Config { return a.store.get() }

func (a *App) GetVersion() string { return version }

// GetConfigPath is where the config actually lives, which differs per OS
// (%APPDATA% on Windows, ~/Library/Application Support on macOS). Asked of Go
// rather than spelled out in the UI, where it was a hardcoded Windows path
// that was simply wrong on a Mac.
func (a *App) GetConfigPath() string {
	p, err := configPath()
	if err != nil {
		return ""
	}
	return p
}

func (a *App) SaveSettings(defaultTimeoutMinutes, warningSeconds int) error {
	return a.store.update(func(c *Config) {
		if defaultTimeoutMinutes > 0 {
			c.DefaultTimeoutMinutes = defaultTimeoutMinutes
		}
		if warningSeconds >= 0 {
			c.WarningSeconds = warningSeconds
		}
	})
}

func (a *App) AddToWatchlist(exe string) error {
	return a.store.update(func(c *Config) {
		if c.find(exe) == nil {
			c.Watchlist = append(c.Watchlist, WatchEntry{Exe: normalizeExe(exe)})
		}
	})
}

func (a *App) RemoveFromWatchlist(exe string) error {
	a.watcher.clearPending(exe)
	return a.store.update(func(c *Config) {
		exe := normalizeExe(exe)
		out := c.Watchlist[:0]
		for _, e := range c.Watchlist {
			if e.Exe != exe {
				out = append(out, e)
			}
		}
		c.Watchlist = out
	})
}

func (a *App) SetTimeout(exe string, minutes int) error {
	return a.store.update(func(c *Config) {
		if e := c.find(exe); e != nil {
			e.TimeoutMinutes = minutes // 0 falls back to the global default
		}
	})
}

// snoozeForever is used for "until I un-snooze": far enough out to never
// expire, without the overflow risk of time.Time's max value.
const snoozeForever = 100 * 365 * 24 * time.Hour

// Snooze pauses watching one app. minutes of 0 un-snoozes it; a negative value
// snoozes it indefinitely.
func (a *App) Snooze(exe string, minutes int) error {
	a.watcher.clearPending(exe)
	return a.store.update(func(c *Config) {
		e := c.find(exe)
		if e == nil {
			return
		}
		switch {
		case minutes == 0:
			e.SnoozedUntil = time.Time{}
		case minutes < 0:
			e.SnoozedUntil = time.Now().Add(snoozeForever)
		default:
			e.SnoozedUntil = time.Now().Add(time.Duration(minutes) * time.Minute)
		}
	})
}

// ClearHistory empties the record of what nightcap has closed.
func (a *App) ClearHistory() error {
	return a.store.update(func(c *Config) { c.History = []KillRecord{} })
}

// SetPaused stops all watching without touching the watchlist.
func (a *App) SetPaused(paused bool) error {
	return a.store.update(func(c *Config) { c.Paused = paused })
}

func (a *App) SetAutostart(enabled bool) error {
	if err := setAutostart(enabled); err != nil {
		return err
	}
	return a.store.update(func(c *Config) { c.Autostart = enabled })
}
