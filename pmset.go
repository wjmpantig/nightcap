package main

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// assertion is one row of `pmset -g assertions`: a process holding a power
// assertion. Unlike powercfg, pmset names the holder's PID — and when a system
// daemon holds the assertion on an app's behalf (coreaudiod does this for any
// app playing audio), a "Created for PID:" line names the app itself.
type assertion struct {
	PID           int
	Name          string // process name as pmset printed it (truncated by the kernel)
	Type          string // e.g. PreventUserIdleSystemSleep
	Reason        string // the assertion's own name string, e.g. "Video Wake Lock"
	CreatedForPID int    // the app it was taken on behalf of; 0 if none
}

// assertionCategories maps the assertion types that actually hold the machine
// or display awake onto the Request categories the UI shares with Windows.
// Everything else pmset lists (UserIsActive, Internal* timers, BackgroundTask
// bookkeeping) is not an app keeping the machine awake and is skipped.
var assertionCategories = map[string]string{
	"PreventUserIdleSystemSleep":  "SYSTEM",
	"PreventSystemSleep":          "SYSTEM",
	"NoIdleSleepAssertion":        "SYSTEM",
	"PreventUserIdleDisplaySleep": "DISPLAY",
	"NoDisplaySleepAssertion":     "DISPLAY",
}

// Requester lines look like:
//
//	pid 214(coreaudiod): [0x00098765] 00:31:24 PreventUserIdleSystemSleep named: "com.apple.audio..."
//
// The name group is greedy so a parenthesised process name ("Google Chrome
// Helper (Renderer)") still ends at the "): [" before the assertion id. The
// hh:mm:ss age is optional; so is the named: suffix.
var (
	pmsetRequester  = regexp.MustCompile(`^pid (\d+)\((.+)\): \[[^\]]*\] (?:\d+:\d{2}:\d{2} )?(\S+)(?: named: "(.*)")?`)
	pmsetCreatedFor = regexp.MustCompile(`^Created for PID: (\d+)`)
)

// parsePmset turns `pmset -g assertions` output into assertions. The
// system-wide summary table and kernel lines carry no owner and are ignored.
func parsePmset(out string) []assertion {
	var asserts []assertion
	for _, raw := range strings.Split(out, "\n") {
		line := strings.TrimSpace(raw)
		if m := pmsetRequester.FindStringSubmatch(line); m != nil {
			pid, _ := strconv.Atoi(m[1])
			asserts = append(asserts, assertion{PID: pid, Name: m[2], Type: m[3], Reason: m[4]})
			continue
		}
		if m := pmsetCreatedFor.FindStringSubmatch(line); m != nil && len(asserts) > 0 {
			asserts[len(asserts)-1].CreatedForPID, _ = strconv.Atoi(m[1])
		}
	}
	return asserts
}

// assertionRequests turns assertions into Requests, resolving each to the
// process that really owns it. A "Created for" PID wins over the daemon that
// fronted the assertion, and the process table supplies the untruncated binary
// name where the kernel cut pmset's off. A pure function so it is testable
// with a fake table.
func assertionRequests(asserts []assertion, table map[uint32]procInfo) []Request {
	var reqs []Request
	for _, a := range asserts {
		cat, ok := assertionCategories[a.Type]
		if !ok {
			continue
		}
		pid, exe := a.PID, normalizeExe(a.Name)
		if a.CreatedForPID > 0 {
			// The daemon is a proxy; attribute the lock to the app. If that app
			// is already gone the exe stays empty — displayed but unkillable,
			// like a Windows driver — rather than blaming the daemon.
			pid, exe = a.CreatedForPID, ""
		}
		if p, ok := table[uint32(pid)]; ok && p.Exe != "" {
			exe = p.Exe
		}
		reqs = append(reqs, Request{
			Category: cat,
			Kind:     "PROCESS",
			Exe:      exe,
			Path:     fmt.Sprintf("pid %d (%s)", a.PID, a.Name),
			Reason:   a.Reason,
		})
	}
	return reqs
}
