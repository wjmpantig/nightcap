package main

import (
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	user32                  = windows.NewLazySystemDLL("user32.dll")
	kernel32                = windows.NewLazySystemDLL("kernel32.dll")
	procGetLastInputInfo    = user32.NewProc("GetLastInputInfo")
	procGetForegroundWindow = user32.NewProc("GetForegroundWindow")
	procGetShellWindow      = user32.NewProc("GetShellWindow")
	procGetWindowRect       = user32.NewProc("GetWindowRect")
	procGetClassNameW       = user32.NewProc("GetClassNameW")
	procMonitorFromWindow   = user32.NewProc("MonitorFromWindow")
	procGetMonitorInfoW     = user32.NewProc("GetMonitorInfoW")
	procGetTickCount        = kernel32.NewProc("GetTickCount")
)

type lastInputInfo struct {
	cbSize uint32
	dwTime uint32
}

type rect struct{ Left, Top, Right, Bottom int32 }

type monitorInfo struct {
	cbSize    uint32
	rcMonitor rect
	rcWork    rect
	dwFlags   uint32
}

// idleTime reports how long since the last keyboard or mouse input.
//
// Both values are 32-bit millisecond tick counts, so this is deliberately done
// in uint32: the subtraction stays correct across the ~49.7 day wrap that would
// otherwise report a wildly negative (or enormous) idle time and kill things.
func idleTime() time.Duration {
	info := lastInputInfo{cbSize: uint32(unsafe.Sizeof(lastInputInfo{}))}
	r, _, _ := procGetLastInputInfo.Call(uintptr(unsafe.Pointer(&info)))
	if r == 0 {
		return 0 // can't tell — treat as active rather than kill something
	}
	tick, _, _ := procGetTickCount.Call()
	return time.Duration(uint32(tick)-info.dwTime) * time.Millisecond
}

// isFullscreenActive reports whether the foreground window covers its whole
// monitor. Used to hold off the idle timer for apps that are NOT watchlisted.
func isFullscreenActive() bool {
	hwnd, _, _ := procGetForegroundWindow.Call()
	if hwnd == 0 {
		return false
	}
	// The desktop is always "fullscreen"; it is not a reason to stay awake.
	if shell, _, _ := procGetShellWindow.Call(); hwnd == shell {
		return false
	}
	switch className(hwnd) {
	case "Progman", "WorkerW", "Shell_TrayWnd":
		return false
	}

	var wr rect
	if r, _, _ := procGetWindowRect.Call(hwnd, uintptr(unsafe.Pointer(&wr))); r == 0 {
		return false
	}

	const monitorDefaultToNearest = 2
	mon, _, _ := procMonitorFromWindow.Call(hwnd, monitorDefaultToNearest)
	if mon == 0 {
		return false
	}
	mi := monitorInfo{cbSize: uint32(unsafe.Sizeof(monitorInfo{}))}
	if r, _, _ := procGetMonitorInfoW.Call(mon, uintptr(unsafe.Pointer(&mi))); r == 0 {
		return false
	}
	// Compare against the window's own monitor, not the primary display, so a
	// maximised window on a second screen isn't mistaken for fullscreen.
	m := mi.rcMonitor
	return wr.Left <= m.Left && wr.Top <= m.Top && wr.Right >= m.Right && wr.Bottom >= m.Bottom
}

func className(hwnd uintptr) string {
	buf := make([]uint16, 256)
	n, _, _ := procGetClassNameW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	return windows.UTF16ToString(buf[:n])
}
