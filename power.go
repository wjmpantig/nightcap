package main

import (
	"strings"
)

// knownCategories are the request types powercfg reports. Anything else that
// looks like a header is still treated as one, this list is only used to tell a
// header apart from a reason line that happens to end in a colon.
var knownCategories = map[string]bool{
	"DISPLAY": true, "SYSTEM": true, "AWAYMODE": true,
	"EXECUTION": true, "PERFBOOST": true, "ACTIVELOCKSCREEN": true,
}

// parsePowercfg turns `powercfg /requests` output into requests.
//
// The format is a category header, then either "None." or a run of requester
// lines, each optionally followed by a free-text reason:
//
//	SYSTEM:
//	[DRIVER] Realtek High Definition Audio (HDAUDIO\...)
//	An audio stream is currently in use.
//	[PROCESS] \Device\HarddiskVolume3\...\vlc.exe
//	Video is playing.
func parsePowercfg(out string) []Request {
	var reqs []Request
	category := ""

	for _, raw := range strings.Split(out, "\n") {
		line := strings.TrimSpace(strings.TrimSuffix(raw, "\r"))
		if line == "" || line == "None." {
			continue
		}

		if h := strings.TrimSuffix(line, ":"); h != line && knownCategories[strings.ToUpper(h)] {
			category = strings.ToUpper(h)
			continue
		}

		if strings.HasPrefix(line, "[") {
			end := strings.Index(line, "]")
			if end < 0 {
				continue
			}
			kind := line[1:end]
			path := strings.TrimSpace(line[end+1:])
			reqs = append(reqs, Request{
				Category: category,
				Kind:     strings.ToUpper(kind),
				Exe:      exeFromRequester(kind, path),
				Path:     path,
			})
			continue
		}

		// A bare line is the reason for the requester above it.
		if n := len(reqs); n > 0 && reqs[n-1].Reason == "" {
			reqs[n-1].Reason = line
		}
	}
	return reqs
}

// exeFromRequester pulls a killable exe name out of a requester string. Only
// PROCESS requesters have one; a driver or service name is not a process we can
// terminate, so it stays empty and decide() skips it.
func exeFromRequester(kind, path string) string {
	if !strings.EqualFold(kind, "PROCESS") {
		return ""
	}
	// powercfg reports NT device paths; the basename is all we match on.
	name := normalizeExe(path)
	if !strings.HasSuffix(name, ".exe") {
		return ""
	}
	return name
}
