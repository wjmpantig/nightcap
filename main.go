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

//go:embed build/windows/icon.ico
var trayIcon []byte

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

func setupTray(app *App) {
	systray.Run(func() {
		systray.SetIcon(trayIcon)
		systray.SetTitle("nightcap")
		systray.SetTooltip("nightcap — wake watcher")

		show := systray.AddMenuItem("Show nightcap", "")
		pause := systray.AddMenuItemCheckbox("Pause watching", "", app.GetConfig().Paused)
		systray.AddSeparator()
		quit := systray.AddMenuItem("Quit", "")

		show.Click(func() { wruntime.WindowShow(app.ctx) })
		pause.Click(func() {
			paused := !pause.Checked()
			if err := app.SetPaused(paused); err != nil {
				log.Println("nightcap: pause:", err)
				return
			}
			if paused {
				pause.Check()
			} else {
				pause.Uncheck()
			}
		})
		quit.Click(func() { wruntime.Quit(app.ctx) })

		systray.SetOnClick(func(systray.IMenu) { wruntime.WindowShow(app.ctx) })
		systray.SetOnRClick(func(m systray.IMenu) { _ = m.ShowMenu() })
	}, nil)
}
