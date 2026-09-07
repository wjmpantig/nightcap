package main

import (
	"context"
	"embed"
	"log"

	"github.com/energye/systray"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	wruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

// The tray shows whether nightcap is actually watching: the mark, or the mark
// with the moon sunk to a sliver. Both are the brand pack's hand-drawn per-size
// art packed by build/windows/make-tray-ico.py — never one image scaled, because
// at 16-24px a 1px gap opens between the disc and the horizon.
//
//go:embed build/windows/tray-active.ico
var trayActive []byte

//go:embed build/windows/tray-inactive.ico
var trayInactive []byte

// trayIcon and trayTooltip are the whole mapping from state to tray appearance.
func trayIcon(paused bool) []byte {
	if paused {
		return trayInactive
	}
	return trayActive
}

func trayTooltip(paused bool) string {
	if paused {
		return "nightcap — paused"
	}
	return "nightcap — watching"
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
		paused := app.GetConfig().Paused
		systray.SetIcon(trayIcon(paused))
		systray.SetTitle("nightcap")
		systray.SetTooltip(trayTooltip(paused))

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
			systray.SetIcon(trayIcon(c.Paused))
			systray.SetTooltip(trayTooltip(c.Paused))
			if c.Paused {
				pause.Check()
			} else {
				pause.Uncheck()
			}
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
