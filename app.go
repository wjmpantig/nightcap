package main

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
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

	mu     sync.Mutex
	update *Update // newest release seen, nil until a check finds one

	// onUpdate is the one hook for "a new release exists", set by setupTray.
	// One hook rather than the update loop poking the tray directly, for the
	// same reason store.watch() exists: the next thing that needs to know
	// registers here instead of a second notifier being bolted on upstream.
	onUpdate func(Update)
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
	go a.watchUpdates(ctx)
}

// updateCheckDelay keeps the first check off the launch path: at login the
// network is routinely not up yet, and nothing here is worth delaying a
// window for.
const (
	updateCheckDelay    = 30 * time.Second
	updateCheckInterval = 24 * time.Hour
)

// watchUpdates polls the signed release manifest and announces a newer one.
//
// Failure is silent by design. "I could not reach GitHub" has no consequence
// for the user — unlike the powercfg/pmset error carried in Status.Error,
// where "I could not check" genuinely differs from "nothing is keeping you
// awake". An unreachable update feed just means no news.
func (a *App) watchUpdates(ctx context.Context) {
	if version == "dev" {
		return // a working-tree build is not on the release timeline
	}
	if updateKey() == nil {
		// No signing key compiled in, so nothing could ever be trusted. Say so
		// once instead of failing a request every 24h forever.
		log.Println("nightcap: update checks disabled (no signing key)")
		return
	}
	t := time.NewTimer(updateCheckDelay)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
		}
		if u, err := fetchUpdate(ctx); err != nil {
			log.Println("nightcap: update check:", err)
		} else if newer(version, u.Version) {
			a.setUpdate(u)
		}
		t.Reset(updateCheckInterval)
	}
}

func (a *App) setUpdate(u Update) {
	a.mu.Lock()
	a.update = &u
	hook := a.onUpdate
	a.mu.Unlock()

	log.Printf("nightcap: %s is available", u.Version)
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "update", u)
	}
	// Called outside the lock: the tray callback has no business being able to
	// deadlock a read of this by calling back in.
	if hook != nil {
		hook(u)
	}
}

// setOnUpdate registers the tray's hook and immediately replays a release that
// was already found, so it does not matter whether the check or the tray got
// there first. Guarded because the two run on different goroutines.
func (a *App) setOnUpdate(f func(Update)) {
	a.mu.Lock()
	a.onUpdate = f
	u := a.update
	a.mu.Unlock()
	if u != nil && f != nil {
		f(*u)
	}
}

// GetUpdate returns the newest release seen, or a zero Update if none. The
// frontend also receives this as an "update" event; this is for the initial
// render, since the first check lands well after the window does.
func (a *App) GetUpdate() Update {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.update == nil {
		return Update{}
	}
	return *a.update
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

// KillNow closes an app immediately because the user pressed the button, with
// no idle timer, no warning countdown and no need for it to be watchlisted.
//
// The exe must be a resolved owner rather than a request's raw image name: a
// shared runtime like msedgewebview2.exe or node is several unrelated apps at
// once, and killByExe refuses it outright. The frontend offers one button per
// Request.targets() entry for exactly that reason.
func (a *App) KillNow(exe string) error { return a.watcher.killNow(exe) }

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
