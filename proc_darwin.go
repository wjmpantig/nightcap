package main

/*
#include <libproc.h>
#include <sys/proc_info.h>
*/
import "C"

import (
	"errors"
	"syscall"
	"time"
	"unsafe"
)

// protected are processes that must never be terminated: killing any of these
// ends the login session or panics the machine (watchdogd's death is treated
// as a hang). The watchlist is free text, so this guard is not optional.
var protected = map[string]bool{
	"launchd": true, "kernel_task": true, "windowserver": true,
	"loginwindow": true, "launchservicesd": true, "runningboardd": true,
	"watchdogd": true, "opendirectoryd": true, "securityd": true,
	"powerd": true, "coreaudiod": true, "hidd": true, "logd": true,
	"notifyd": true, "cfprefsd": true, "distnoted": true,
}

// processTable snapshots every running process with its parent and start time.
func processTable() (map[uint32]procInfo, error) {
	n := C.proc_listallpids(nil, 0)
	if n <= 0 {
		return nil, errors.New("proc_listallpids failed")
	}
	// Headroom: processes can appear between the size call and the fill call.
	pids := make([]C.int, n+64)
	n = C.proc_listallpids(unsafe.Pointer(&pids[0]), C.int(len(pids))*C.int(unsafe.Sizeof(pids[0])))
	if n <= 0 {
		return nil, errors.New("proc_listallpids failed")
	}

	out := map[uint32]procInfo{}
	for _, cpid := range pids[:n] {
		if cpid <= 0 {
			continue
		}
		var bi C.struct_proc_bsdinfo
		if C.proc_pidinfo(cpid, C.PROC_PIDTBSDINFO, 0, unsafe.Pointer(&bi), C.int(unsafe.Sizeof(bi))) != C.int(unsafe.Sizeof(bi)) {
			continue // exited between the two calls, or refuses to answer
		}
		out[uint32(cpid)] = procInfo{
			PID:     uint32(cpid),
			PPID:    uint32(bi.pbi_ppid),
			Exe:     exeOf(cpid, &bi),
			Created: time.Unix(int64(bi.pbi_start_tvsec), int64(bi.pbi_start_tvusec)*1000),
		}
	}
	return out, nil
}

// exeOf is the lowercased basename of the process's binary. proc_pidpath gives
// the untruncated path; the bsdinfo names are capped at 16 and 32 bytes by the
// kernel ("Google Chrome Helper (Renderer)" does not fit), so they are only
// fallbacks for processes that refuse to report a path.
func exeOf(pid C.int, bi *C.struct_proc_bsdinfo) string {
	buf := make([]byte, C.PROC_PIDPATHINFO_MAXSIZE)
	if n := C.proc_pidpath(pid, unsafe.Pointer(&buf[0]), C.uint32_t(len(buf))); n > 0 {
		return normalizeExe(string(buf[:n]))
	}
	if name := C.GoString(&bi.pbi_name[0]); name != "" {
		return normalizeExe(name)
	}
	return normalizeExe(C.GoString(&bi.pbi_comm[0]))
}

// killPID matches TerminateProcess semantics on the Windows side: an immediate,
// unignorable stop. The app being closed has already ignored the user for the
// whole timeout, so a polite SIGTERM it could swallow is not the tool.
func killPID(pid uint32) error {
	return syscall.Kill(int(pid), syscall.SIGKILL)
}
