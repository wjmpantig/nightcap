package main

import (
	"fmt"
	"os"
	"sort"
	"strings"
)

// killByExe terminates every process with the given basename, along with its
// descendants.
//
// The tree matters: closing an app that hosts a WebView2 or similar runtime
// leaves orphaned child processes behind, which may keep holding the very wake
// lock we were trying to release.
//
// The walk is platform-free; processTable, killPID and protected are what each
// platform provides.
func killByExe(exe string) error {
	exe = normalizeExe(exe)
	if protected[exe] {
		return fmt.Errorf("%s is a protected system process and will not be killed", exe)
	}
	// The OS identifies holders by name only, so a runtime name matches every
	// unrelated app embedding it. Refuse rather than close all of them.
	if isGenericHost(exe) {
		return fmt.Errorf("%s is a shared runtime, not an app; watch the application that owns it instead", exe)
	}

	table, err := processTable()
	if err != nil {
		return err
	}

	var roots []uint32
	for pid, p := range table {
		if p.Exe == exe {
			roots = append(roots, pid)
		}
	}
	if len(roots) == 0 {
		return nil // already gone
	}
	sort.Slice(roots, func(i, j int) bool { return roots[i] < roots[j] })

	self := uint32(os.Getpid())
	var failures []string
	killed := 0
	for _, root := range roots {
		// Children first, so the parent cannot spawn replacements as it dies.
		for _, pid := range append(descendants(table, root), root) {
			if pid == self || pid == 0 {
				continue
			}
			if protected[table[pid].Exe] {
				continue // never follow a tree into a system process
			}
			if err := killPID(pid); err != nil {
				// One stubborn PID must not stop us killing the rest.
				failures = append(failures, fmt.Sprintf("pid %d: %v", pid, err))
				continue
			}
			killed++
		}
	}
	if len(failures) > 0 && killed == 0 {
		return fmt.Errorf("%s", strings.Join(failures, "; "))
	}
	return nil
}
