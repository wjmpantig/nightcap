package main

import (
	"sort"
	"time"
)

// procInfo is one row of the process table.
type procInfo struct {
	PID     uint32
	PPID    uint32
	Exe     string    // lowercased basename
	Created time.Time // zero if it could not be read (protected process)
}

// genericHosts are executables whose name identifies a runtime, not an app.
// A wake lock held by one of these tells you nothing about who to close, and
// killing every process with the name would take out unrelated applications:
// a typical desktop runs several independent msedgewebview2.exe trees owned by
// Search, Widgets, Google Drive and so on.
var genericHosts = map[string]bool{
	"msedgewebview2.exe":       true,
	"dllhost.exe":              true,
	"rundll32.exe":             true,
	"svchost.exe":              true,
	"backgroundtaskhost.exe":   true,
	"applicationframehost.exe": true,
	"conhost.exe":              true,
	"wscript.exe":              true,
	"cscript.exe":              true,
	"java.exe":                 true,
	"javaw.exe":                true,
	"node.exe":                 true,
	"python.exe":               true,
	"pythonw.exe":              true,
	"electron.exe":             true,
	// macOS spellings of the same idea: an interpreter or runtime name says
	// which tool is running, not whose work it is. The shells are here so a
	// resolveHost walk climbs through them to the terminal app that owns them
	// instead of reporting "zsh" as the application.
	"node": true, "java": true, "python": true, "python3": true,
	"electron": true, "ruby": true, "sh": true, "bash": true, "zsh": true,
}

func isGenericHost(exe string) bool { return genericHosts[exe] }

// maxAncestorWalk bounds the climb. Real chains are 2-3 deep; anything longer
// means a corrupt table or a PID-reuse loop.
const maxAncestorWalk = 16

// validParent reports whether parent really is child's parent.
//
// Windows recycles PIDs, so a process whose parent has exited can point at an
// unrelated process that later claimed the same PID. A real parent must have
// been created before its child; that check is what stops nightcap attributing
// a wake lock to a random application. Times are only compared when both are
// known, since protected processes refuse to report theirs.
func validParent(parent, child procInfo) bool {
	if parent.PID == 0 || parent.PID == child.PID {
		return false
	}
	if parent.Created.IsZero() || child.Created.IsZero() {
		return true
	}
	return !parent.Created.After(child.Created)
}

// resolveHost walks up from pid to the application that owns it, and returns
// that application's exe name ("" if it can't be determined).
//
// WebView2 nests: renderer -> browser -> host app, so climbing a single level
// just lands on another msedgewebview2.exe. Keep climbing while the ancestor is
// the same executable or another generic runtime; the first ancestor that is
// neither is the real owner.
func resolveHost(table map[uint32]procInfo, pid uint32) string {
	cur, ok := table[pid]
	if !ok {
		return ""
	}
	seen := map[uint32]bool{pid: true}

	for i := 0; i < maxAncestorWalk; i++ {
		parent, ok := table[cur.PPID]
		if !ok || seen[parent.PID] || !validParent(parent, cur) {
			return ""
		}
		if parent.Exe != cur.Exe && !isGenericHost(parent.Exe) {
			return parent.Exe
		}
		seen[parent.PID] = true
		cur = parent
	}
	return ""
}

// hostsOf returns the distinct applications owning every process named exe.
//
// powercfg reports wake-lock holders by image path and never by PID, so when a
// runtime holds the lock there is no way to tell which instance it was. All
// owners are returned and the ambiguity is shown to the user rather than
// guessed at.
func hostsOf(table map[uint32]procInfo, exe string) []string {
	seen := map[string]bool{}
	for pid, p := range table {
		if p.Exe != exe {
			continue
		}
		if h := resolveHost(table, pid); h != "" {
			seen[h] = true
		}
	}
	out := make([]string, 0, len(seen))
	for h := range seen {
		out = append(out, h)
	}
	sort.Strings(out)
	return out
}

// descendants returns every process below root, deepest first, so a caller can
// terminate children before their parent.
func descendants(table map[uint32]procInfo, root uint32) []uint32 {
	byParent := map[uint32][]uint32{}
	for pid, p := range table {
		if pid == root {
			continue
		}
		if parent, ok := table[p.PPID]; ok && validParent(parent, p) {
			byParent[p.PPID] = append(byParent[p.PPID], pid)
		}
	}

	var out []uint32
	seen := map[uint32]bool{root: true}
	queue := []uint32{root}
	for len(queue) > 0 && len(out) < 1024 {
		cur := queue[0]
		queue = queue[1:]
		kids := byParent[cur]
		sort.Slice(kids, func(i, j int) bool { return kids[i] < kids[j] })
		for _, kid := range kids {
			if seen[kid] {
				continue
			}
			seen[kid] = true
			out = append(out, kid)
			queue = append(queue, kid)
		}
	}
	// Deepest first: reversing a BFS ordering puts children before parents.
	for i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {
		out[i], out[j] = out[j], out[i]
	}
	return out
}

// annotateHosts fills in Hosts for requests held by a generic runtime. The
// table is only built when one actually appears, since it costs a syscall per
// process.
func annotateHosts(reqs []Request, table func() map[uint32]procInfo) []Request {
	needed := false
	for _, r := range reqs {
		if r.Exe != "" && isGenericHost(r.Exe) {
			needed = true
			break
		}
	}
	if !needed {
		return reqs
	}

	t := table()
	for i, r := range reqs {
		if r.Exe != "" && isGenericHost(r.Exe) {
			reqs[i].Hosts = hostsOf(t, r.Exe)
		}
	}
	return reqs
}

// targets returns the exe names a request can be matched against in the
// watchlist. A generic runtime is deliberately not one of them: watchlisting
// msedgewebview2.exe would mean "close every WebView2 app on this machine".
func (r Request) targets() []string {
	if r.Exe == "" {
		return nil
	}
	if isGenericHost(r.Exe) {
		return r.Hosts
	}
	return []string{r.Exe}
}
