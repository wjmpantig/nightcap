package main

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Cocoa

#import <Cocoa/Cocoa.h>

// systray's own start hook (energye/systray systray_darwin.m). Calling it via
// C keeps the whole dance on the main thread; the Go-side start() wrapper is
// the same function but would run it on whatever thread the goroutine holds,
// and NSStatusBar is main-thread-only.
extern void nativeStart(void);

// nc_tray_start runs systray's startup inside the running Wails app.
//
// systray was written to own the application: its nativeStart replaces the
// NSApp delegate with its own, which would silently take over Wails'
// applicationShouldTerminate handling. Its delegate is only needed for the
// onExit callback (unused here) — the status item itself lives in a global and
// keeps working — so the Wails delegate is put back before anything can miss it.
static void nc_tray_start(void) {
	dispatch_sync(dispatch_get_main_queue(), ^{
		id saved = [NSApplication sharedApplication].delegate;
		nativeStart();
		[[NSApplication sharedApplication] setDelegate:saved];
	});
}
*/
import "C"

// trayStart runs the start half of systray.RunWithExternalLoop. The argument
// is ignored on purpose: it is systray's nativeStart, which must be called on
// the main thread here, with the app delegate protected — see nc_tray_start.
func trayStart(func()) { C.nc_tray_start() }
