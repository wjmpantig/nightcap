package main

// trayStart runs the start half of systray.RunWithExternalLoop. On Windows it
// spins its own message pump on a dedicated thread, so there is nothing to
// coordinate with Wails.
func trayStart(start func()) { start() }
