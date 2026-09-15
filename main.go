package main

import (
	"context"
	"embed"
	"fmt"
	"log"
	"sync"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

// The tray shows whether anything is holding this machine awake: the mark, or
// the mark with the moon sunk to a sliver. Both are the brand pack's hand-drawn per-size
// art packed by build/windows/make-tray-ico.py — never one image scaled, because
// at 16-24px a 1px gap opens between the disc and the horizon.
//
//go:embed build/windows/tray-active.ico
var trayActive []byte

//go:embed build/windows/tray-inactive.ico
var trayInactive []byte

// trayState is everything the tray knows. Two sources feed it — the config
// (paused) and each published Status (awake, blind) — so it is assembled in one
// place rather than each hook computing an icon from half the picture.
type trayState struct {
	paused bool
	awake  int  // wake locks held right now
	blind  bool // the last query failed: we do not know what is awake
}

// trayIcon and trayTooltip are the whole mapping from state to tray appearance.
//
// The mark is lit only while something is actually holding a wake lock: that is
// the brand's own metaphor (moon up vs moon set) and the one thing a glance at
// the taskbar should answer. Paused and "nothing is awake" both read as dim —
// they are the same news, that nightcap is not about to close anything — and the
// tooltip is what separates them.
func trayIcon(st trayState) []byte {
	if st.paused || st.blind || st.awake == 0 {
		return trayInactive
	}
	return trayActive
}

func trayTooltip(st trayState) string {
	switch {
	case st.paused:
		return "nightcap — paused"
	// "I couldn't check" and "nothing is awake" are different states, and the
	// icon cannot tell them apart, so the tooltip has to.
	case st.blind:
		return "nightcap — cannot read the power requests"
	case st.awake == 1:
		return "nightcap — 1 thing is keeping this machine awake"
	case st.awake > 1:
		return fmt.Sprintf("nightcap — %d things are keeping this machine awake", st.awake)
	default:
		return "nightcap — watching, nothing is awake"
	}
}

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:            "nightcap",
		Width:            900,
		Height:           660,
		MinWidth:         680,
		MinHeight:        480,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 17, G: 19, B: 26, A: 1},
		// Closing the window keeps the watcher running in the tray.
		HideWindowOnClose: true,
		// Two elevated watchers would race to kill the same process; the second
		// launch just raises the first window instead.
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: "nightcap-wake-watcher",
			OnSecondInstanceLaunch: func(options.SecondInstanceData) {
				wruntime.WindowShow(app.ctx)
			},
		},
		OnStartup: func(ctx context.Context) {
			app.startup(ctx)
			go setupTray(app)
		},
		Bind: []interface{}{app},
	})
	if err != nil {
		log.Println("nightcap:", err)
	}
}

// setupTray registers the tray via RunWithExternalLoop rather than
// systray.Run: Run spins its own event loop, and on macOS that is a second
// [NSApp run] beside the one Wails already owns — an instant SIGTRAP. The
// external-loop form registers the callbacks and lets each platform's
// trayStart decide how the loop is entered.
func setupTray(app *App) {
	start, _ := systray.RunWithExternalLoop(func() {
		// The two hooks below fire on different goroutines and each knows only
		// half of trayState, so they both go through render() under this lock
		// rather than either one calling SetIcon with a stale other half.
		var (
			mu  sync.Mutex
			cur trayState
		)
		render := func(f func(*trayState)) {
			mu.Lock()
			f(&cur)
			st := cur
			mu.Unlock()
			systray.SetIcon(trayIcon(st))
			systray.SetTooltip(trayTooltip(st))
		}

		paused := app.GetConfig().Paused
		cur = trayState{paused: paused}
		systray.SetIcon(trayIcon(cur))
		systray.SetTitle("nightcap")
		systray.SetTooltip(trayTooltip(cur))

		show := systray.AddMenuItem("Show nightcap", "")
		pause := systray.AddMenuItemCheckbox("Pause watching", "", paused)
		// Added up front and hidden: the menu is built once here, but an update
		// is only discovered a while after launch. The tray *icon* deliberately
		// does not change — the .ico files are hand-drawn per size and never
		// scaled, so a third state would need new art from the brand pack.
		update := systray.AddMenuItem("Update available", "")
		update.Hide()
		systray.AddSeparator()
		quit := systray.AddMenuItem("Quit", "")

		// One hook, every source of truth: the tray follows the config rather
		// than each caller updating it. A pause from the window's switch, from
		// the settings view, or from this menu item all land here.
		app.store.watch(func(c Config) {
			render(func(st *trayState) { st.paused = c.Paused })
			if c.Paused {
				pause.Check()
			} else {
				pause.Uncheck()
			}
		})

		// And the same again for the picture itself: the watcher publishes, the
		// tray follows. setOnStatus replays the last status, so a tray built
		// after the first tick is not dark until the next one.
		app.setOnStatus(func(s Status) {
			render(func(st *trayState) {
				st.blind = s.Error != ""
				st.awake = len(s.Requests)
			})
		})

		// The same one-hook rule as store.watch() above: the update loop
		// announces once and the tray follows, rather than the loop knowing
		// about menu items. setOnUpdate also replays a release already found,
		// so it does not matter which of the two got here first.
		app.setOnUpdate(func(u Update) {
			update.SetTitle("Update to " + u.Version)
			update.SetTooltip("Open the " + u.Version + " release page")
			update.Show()
		})

		show.Click(func() { wruntime.WindowShow(app.ctx) })
		// Registered once, reading the URL when clicked rather than closing
		// over it, so a second announcement cannot stack a second handler.
		update.Click(func() {
			if u := app.GetUpdate(); u.URL != "" {
				wruntime.BrowserOpenURL(app.ctx, u.URL)
			}
		})
		pause.Click(func() {
			if err := app.SetPaused(!pause.Checked()); err != nil {
				log.Println("nightcap: pause:", err)
			}
		})
		quit.Click(func() { wruntime.Quit(app.ctx) })

		systray.SetOnClick(func(systray.IMenu) { wruntime.WindowShow(app.ctx) })
		systray.SetOnRClick(func(m systray.IMenu) { _ = m.ShowMenu() })
	}, nil)
	trayStart(start)
}
