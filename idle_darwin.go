package main

/*
#cgo LDFLAGS: -framework CoreGraphics -framework CoreFoundation
#include <CoreGraphics/CoreGraphics.h>

static double nc_idle_seconds(void) {
	return CGEventSourceSecondsSinceLastEventType(
		kCGEventSourceStateCombinedSessionState, kCGAnyInputEventType);
}

// nc_frontmost_fullscreen reports whether the frontmost normal window covers
// its whole display. The window list is ordered front to back, so the first
// layer-0 entry is the foreground app window; the menu bar, Dock and desktop
// all live on other layers, which is what keeps an empty desktop from counting
// as fullscreen. Bounds and layers need no screen-recording permission — only
// window *names* do, and those are never asked for.
static int nc_frontmost_fullscreen(void) {
	CFArrayRef list = CGWindowListCopyWindowInfo(
		kCGWindowListOptionOnScreenOnly | kCGWindowListExcludeDesktopElements,
		kCGNullWindowID);
	if (list == NULL) {
		return 0;
	}

	int covers = 0;
	CFIndex n = CFArrayGetCount(list);
	for (CFIndex i = 0; i < n; i++) {
		CFDictionaryRef w = CFArrayGetValueAtIndex(list, i);
		int layer = -1;
		CFNumberRef l = CFDictionaryGetValue(w, kCGWindowLayer);
		if (l == NULL || !CFNumberGetValue(l, kCFNumberIntType, &layer) || layer != 0) {
			continue;
		}

		CGRect r;
		CFDictionaryRef b = CFDictionaryGetValue(w, kCGWindowBounds);
		if (b == NULL || !CGRectMakeWithDictionaryRepresentation(b, &r)) {
			break;
		}

		// Compare against the display the window sits on, not the main one, so
		// a fullscreen video on a second screen still counts.
		CGDirectDisplayID ids[16];
		uint32_t count = 0;
		if (CGGetActiveDisplayList(16, ids, &count) != kCGErrorSuccess) {
			break;
		}
		CGPoint mid = CGPointMake(CGRectGetMidX(r), CGRectGetMidY(r));
		for (uint32_t d = 0; d < count; d++) {
			CGRect db = CGDisplayBounds(ids[d]);
			if (!CGRectContainsPoint(db, mid)) {
				continue;
			}
			covers = CGRectContainsRect(r, db) ? 1 : 0;
			break;
		}
		break; // only the frontmost layer-0 window matters
	}
	CFRelease(list);
	return covers;
}
*/
import "C"

import "time"

// idleTime reports how long since the last keyboard, mouse or trackpad input.
// Quartz hands this over as seconds in a double; none of the 32-bit tick
// arithmetic the Windows side needs applies here.
func idleTime() time.Duration {
	return time.Duration(float64(C.nc_idle_seconds()) * float64(time.Second))
}

// isFullscreenActive reports whether the foreground window covers its whole
// display. Used to hold off the idle timer for apps that are NOT watchlisted.
func isFullscreenActive() bool {
	return C.nc_frontmost_fullscreen() != 0
}
