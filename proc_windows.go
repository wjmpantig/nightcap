package main

import (
	"sort"
	"strings"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
)

// protected are processes that must never be terminated: killing any of these
// bugchecks the machine or takes the session down with it. nightcap runs
// elevated and the watchlist is free text, so this guard is not optional.
var protected = map[string]bool{
	"system": true, "smss.exe": true, "csrss.exe": true, "wininit.exe": true,
	"winlogon.exe": true, "services.exe": true, "lsass.exe": true,
	"svchost.exe": true, "system idle process": true, "memory compression": true,
	"registry": true, "fontdrvhost.exe": true, "dwm.exe": true,
}

// processTable snapshots every running process with its parent and start time.
func processTable() (map[uint32]procInfo, error) {
	snap, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return nil, err
	}
	defer windows.CloseHandle(snap)

	out := map[uint32]procInfo{}
	var e windows.ProcessEntry32
	e.Size = uint32(unsafe.Sizeof(e))
	for err = windows.Process32First(snap, &e); err == nil; err = windows.Process32Next(snap, &e) {
		out[e.ProcessID] = procInfo{
			PID:     e.ProcessID,
			PPID:    e.ParentProcessID,
			Exe:     strings.ToLower(windows.UTF16ToString(e.ExeFile[:])),
			Created: creationTime(e.ProcessID),
		}
	}
	if err != nil && err != windows.ERROR_NO_MORE_FILES {
		return nil, err
	}
	return out, nil
}

// creationTime is needed to tell a real parent from a recycled PID. A zero
// value means unknown (protected processes refuse to answer), which callers
// treat as "don't reject the link" rather than as a failure.
func creationTime(pid uint32) time.Time {
	h, err := windows.OpenProcess(windows.PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
	if err != nil {
		return time.Time{}
	}
	defer windows.CloseHandle(h)

	var created, exit, kernel, user windows.Filetime
	if err := windows.GetProcessTimes(h, &created, &exit, &kernel, &user); err != nil {
		return time.Time{}
	}
	return time.Unix(0, created.Nanoseconds())
}

// pidsByExe maps lowercased process basenames to their PIDs.
func pidsByExe() (map[string][]uint32, error) {
	table, err := processTable()
	if err != nil {
		return nil, err
	}
	out := map[string][]uint32{}
	for pid, p := range table {
		out[p.Exe] = append(out[p.Exe], pid)
	}
	for _, pids := range out {
		sort.Slice(pids, func(i, j int) bool { return pids[i] < pids[j] })
	}
	return out, nil
}

func killPID(pid uint32) error {
	h, err := windows.OpenProcess(windows.PROCESS_TERMINATE, false, pid)
	if err != nil {
		return err
	}
	defer windows.CloseHandle(h)
	return windows.TerminateProcess(h, 1)
}
