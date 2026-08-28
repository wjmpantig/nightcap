package main

import (
	"context"
	"log"
	"sort"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// Snapshot is everything the decision needs to know about the machine right now.
type Snapshot struct {
	IdleFor    time.Duration
	Fullscreen bool
	Requests   []Request
}

// decide returns the exes that should be killed, given the current state of the
// machine. It is pure: no clock, no syscalls, no I/O — all of that is the
// caller's problem, which is what makes the rules testable.
func decide(now time.Time, s Snapshot, cfg Config) []string {
	if cfg.Paused {
		return nil
	}

	// Which watched apps are actually holding the machine awake right now?
	// Snoozed entries don't count — for the fullscreen rule below either.
	holders := map[string]WatchEntry{}
	for _, r := range s.Requests {
		// A request matches on the app that owns it, which for a shared runtime
		// is its host rather than the runtime's own name.
		for _, name := range r.targets() {
			e := cfg.find(name)
			if e == nil || e.Snoozed(now) {
				continue
			}
			holders[e.Exe] = *e
		}
	}
	if len(holders) == 0 {
		return nil
	}

	// Fullscreen normally pauses the idle timer, but a watched app holding a
	// wake lock is an explicit "no pass" — otherwise a fullscreen player stuck
	// on a paused video could never be caught, which is the whole point.
	// Since we only get here with at least one holder, fullscreen loses.

	var kill []string
	for exe, e := range holders {
		if s.IdleFor >= e.Timeout(cfg) {
			kill = append(kill, exe)
		}
	}
	sort.Strings(kill) // stable output for tests and for the UI
	return kill
}

// idleGate reports whether the idle clock should be running at all, for apps
// that are NOT on the watchlist. Used only to display honest status in the UI —
// decide() handles the watched case itself.
func idleGate(s Snapshot) bool { return !s.Fullscreen }

// pending is an app in its warning countdown.
type pending struct {
	Exe      string    `json:"exe"`
	Deadline time.Time `json:"deadline"`
}

// Status is pushed to the frontend on every tick.
type Status struct {
	Requests   []Request `json:"requests"`
	IdleSecs   int       `json:"idleSecs"`
	Fullscreen bool      `json:"fullscreen"`
	Pending    []pending `json:"pending"`
	Error      string    `json:"error"` // e.g. "needs admin"
	Warning    string    `json:"warning"`
}

type watcher struct {
	store *store
	ctx   context.Context

	mu      sync.Mutex
	pending map[string]time.Time // exe -> kill deadline
	last    Status

	// injectable for tests / future platforms
	sample func() (Snapshot, error)
	kill   func(exe string) error
	now    func() time.Time
}

func newWatcher(s *store) *watcher {
	return &watcher{
		store:   s,
		pending: map[string]time.Time{},
		sample:  sampleSystem,
		kill:    killByExe,
		now:     time.Now,
	}
}

const tickInterval = 5 * time.Second

func (w *watcher) run(ctx context.Context) {
	w.ctx = ctx
	t := time.NewTicker(tickInterval)
	defer t.Stop()
	w.tick()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			w.tick()
		}
	}
}

func (w *watcher) tick() {
	now := w.now()
	cfg := w.store.get()

	st := Status{Warning: w.store.warn}
	snap, err := w.sample()
	if err != nil {
		// An empty list and a failed query must not look the same.
		st.Error = err.Error()
		w.publish(st)
		return
	}
	st.Requests = snap.Requests
	st.IdleSecs = int(snap.IdleFor.Seconds())
	st.Fullscreen = snap.Fullscreen

	targets := decide(now, snap, cfg)
	inTarget := map[string]bool{}
	for _, e := range targets {
		inTarget[e] = true
	}

	w.mu.Lock()
	// Drop countdowns whose app no longer qualifies (user came back, app let go,
	// entry got snoozed or removed).
	for exe := range w.pending {
		if !inTarget[exe] {
			delete(w.pending, exe)
		}
	}
	var due []string
	warning := time.Duration(cfg.WarningSeconds) * time.Second
	for _, exe := range targets {
		deadline, ok := w.pending[exe]
		if !ok {
			w.pending[exe] = now.Add(warning)
			continue
		}
		if !now.Before(deadline) {
			due = append(due, exe)
			delete(w.pending, exe)
		}
	}
	for exe, deadline := range w.pending {
		st.Pending = append(st.Pending, pending{Exe: exe, Deadline: deadline})
	}
	w.mu.Unlock()

	sort.Slice(st.Pending, func(i, j int) bool { return st.Pending[i].Exe < st.Pending[j].Exe })

	if len(st.Pending) > 0 && w.ctx != nil {
		runtime.WindowShow(w.ctx) // surface the countdown so it can be snoozed
	}
	for _, exe := range due {
		if err := w.kill(exe); err != nil {
			log.Printf("nightcap: kill %s: %v", exe, err)
			st.Error = "could not kill " + exe + ": " + err.Error()
			continue
		}
		log.Printf("nightcap: killed %s after idle timeout", exe)
		w.record(KillRecord{
			Exe:      exe,
			At:       now,
			IdleSecs: st.IdleSecs,
			Category: categoryOf(snap.Requests, exe),
			Reason:   reasonOf(snap.Requests, exe),
		})
	}
	w.publish(st)
}

// record prepends a kill to the history, newest first.
func (w *watcher) record(r KillRecord) {
	if err := w.store.update(func(c *Config) {
		c.History = append([]KillRecord{r}, c.History...)
	}); err != nil {
		log.Printf("nightcap: could not save kill history: %v", err)
	}
}

// categoryOf and reasonOf pull the app's own explanation out of the snapshot
// that triggered the kill, so the history says why it was holding the lock.
func categoryOf(reqs []Request, exe string) string {
	for _, r := range reqs {
		for _, name := range r.targets() {
			if name == exe {
				return r.Category
			}
		}
	}
	return ""
}

func reasonOf(reqs []Request, exe string) string {
	for _, r := range reqs {
		if r.Reason == "" {
			continue
		}
		for _, name := range r.targets() {
			if name == exe {
				return r.Reason
			}
		}
	}
	return ""
}

// normalize replaces nil slices with empty ones.
//
// Go marshals a nil slice as JSON null, not [], so a Status that has never been
// populated arrives in the frontend as {"requests": null} and the first
// .filter() on it throws, blanking the window. Fixed here, at the single point
// every Status crosses the boundary, rather than in each consumer.
func normalize(st Status) Status {
	if st.Requests == nil {
		st.Requests = []Request{}
	}
	for i := range st.Requests {
		if st.Requests[i].Hosts == nil {
			st.Requests[i].Hosts = []string{}
		}
	}
	if st.Pending == nil {
		st.Pending = []pending{}
	}
	return st
}

func (w *watcher) publish(st Status) {
	st = normalize(st)
	w.mu.Lock()
	w.last = st
	w.mu.Unlock()
	if w.ctx != nil {
		runtime.EventsEmit(w.ctx, "status", st)
	}
}

// status is also served before the first tick has run, so it must normalize the
// zero value rather than assume publish() has already been through.
func (w *watcher) status() Status {
	w.mu.Lock()
	defer w.mu.Unlock()
	return normalize(w.last)
}

// clearPending drops any countdown for exe, e.g. once it has been snoozed.
func (w *watcher) clearPending(exe string) {
	w.mu.Lock()
	delete(w.pending, exe)
	w.mu.Unlock()
}
