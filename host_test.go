package main

import (
	"testing"
	"time"
)

var base = time.Date(2026, 8, 28, 12, 0, 0, 0, time.UTC)

// mirrors the real shape found on a live machine: several independent
// WebView2 trees, each renderer two levels below its owning app.
func webviewTable() map[uint32]procInfo {
	at := func(m int) time.Time { return base.Add(time.Duration(m) * time.Minute) }
	rows := []procInfo{
		{PID: 4, PPID: 0, Exe: "system", Created: at(0)},
		{PID: 19076, PPID: 4, Exe: "searchhost.exe", Created: at(1)},
		{PID: 19848, PPID: 19076, Exe: "msedgewebview2.exe", Created: at(2)},
		{PID: 20984, PPID: 19848, Exe: "msedgewebview2.exe", Created: at(3)}, // renderer
		{PID: 14568, PPID: 4, Exe: "widgets.exe", Created: at(1)},
		{PID: 46120, PPID: 14568, Exe: "msedgewebview2.exe", Created: at(2)},
		{PID: 51504, PPID: 46120, Exe: "msedgewebview2.exe", Created: at(3)},
		{PID: 98536, PPID: 4, Exe: "nightcap.exe", Created: at(1)},
		{PID: 29008, PPID: 98536, Exe: "msedgewebview2.exe", Created: at(2)},
		{PID: 6224, PPID: 29008, Exe: "msedgewebview2.exe", Created: at(3)},
		{PID: 7000, PPID: 4, Exe: "vlc.exe", Created: at(4)},
	}
	t := map[uint32]procInfo{}
	for _, r := range rows {
		t[r.PID] = r
	}
	return t
}

func TestResolveHostClimbsPastSameNamedAncestors(t *testing.T) {
	table := webviewTable()
	for pid, want := range map[uint32]string{
		20984: "searchhost.exe", // renderer, two levels down
		19848: "searchhost.exe", // browser process, one level down
		51504: "widgets.exe",
		6224:  "nightcap.exe",
	} {
		if got := resolveHost(table, pid); got != want {
			t.Errorf("resolveHost(%d) = %q, want %q", pid, got, want)
		}
	}
}

// The whole point: four WebView2 trees, four different owners. Killing by the
// runtime's name would take out all of them.
func TestHostsOfReportsEveryOwner(t *testing.T) {
	got := hostsOf(webviewTable(), "msedgewebview2.exe")
	want := []string{"nightcap.exe", "searchhost.exe", "widgets.exe"}
	if !equal(got, want) {
		t.Fatalf("hostsOf = %v, want %v", got, want)
	}
}

// Windows recycles PIDs: a dead parent's slot can be taken by a process started
// later. A parent that postdates its child is not the parent.
func TestStalePPIDIsRejected(t *testing.T) {
	table := webviewTable()
	victim := table[19848]
	recycled := table[19076]
	recycled.Exe = "unrelated.exe"
	recycled.Created = victim.Created.Add(time.Hour) // started AFTER its "child"
	table[19076] = recycled

	if got := resolveHost(table, 19848); got != "" {
		t.Errorf("resolveHost followed a recycled PID to %q, want no answer", got)
	}
}

func TestResolveHostSurvivesCycles(t *testing.T) {
	table := map[uint32]procInfo{
		10: {PID: 10, PPID: 11, Exe: "msedgewebview2.exe", Created: base},
		11: {PID: 11, PPID: 10, Exe: "msedgewebview2.exe", Created: base},
	}
	if got := resolveHost(table, 10); got != "" {
		t.Errorf("resolveHost = %q, want empty on a cycle", got)
	}
}

func TestDescendantsAreDeepestFirst(t *testing.T) {
	got := descendants(webviewTable(), 14568) // widgets.exe
	if !equalU32(got, []uint32{51504, 46120}) {
		t.Fatalf("descendants = %v, want the renderer before the browser process", got)
	}
	if len(descendants(webviewTable(), 7000)) != 0 {
		t.Error("vlc.exe should have no descendants")
	}
}

// A request held by a shared runtime must never be watchable under the
// runtime's own name.
func TestRequestTargets(t *testing.T) {
	webview := Request{Exe: "msedgewebview2.exe", Hosts: []string{"widgets.exe"}}
	if got := webview.targets(); !equal(got, []string{"widgets.exe"}) {
		t.Errorf("targets = %v, want [widgets.exe]", got)
	}
	// Unknown owner: nothing to offer, rather than falling back to the runtime.
	orphan := Request{Exe: "msedgewebview2.exe"}
	if got := orphan.targets(); len(got) != 0 {
		t.Errorf("targets = %v, want none when the owner is unknown", got)
	}
	if got := (Request{Exe: "vlc.exe"}).targets(); !equal(got, []string{"vlc.exe"}) {
		t.Errorf("targets = %v, want [vlc.exe]", got)
	}
}

func TestDecideMatchesOnHostNotRuntime(t *testing.T) {
	snap := Snapshot{
		IdleFor:  time.Hour,
		Requests: []Request{{Category: "SYSTEM", Kind: "PROCESS", Exe: "msedgewebview2.exe", Hosts: []string{"widgets.exe"}}},
	}
	// Watching the owner catches it.
	if got := decide(now, snap, sanitize(cfgWith(WatchEntry{Exe: "widgets.exe"}))); !equal(got, []string{"widgets.exe"}) {
		t.Errorf("decide = %v, want [widgets.exe]", got)
	}
	// Watching the runtime name catches nothing: it would mean every WebView2 app.
	if got := decide(now, snap, sanitize(cfgWith(WatchEntry{Exe: "msedgewebview2.exe"}))); len(got) != 0 {
		t.Errorf("decide = %v, want nothing when only the runtime is watched", got)
	}
}

func TestKillByExeRefusesSharedRuntimes(t *testing.T) {
	if err := killByExe("msedgewebview2.exe"); err == nil {
		t.Fatal("killByExe accepted a shared runtime; that would close every WebView2 app")
	}
}

// annotateHosts must not pay for a process table when no runtime is involved.
func TestAnnotateHostsSkipsWorkWhenUnneeded(t *testing.T) {
	called := false
	reqs := annotateHosts([]Request{{Exe: "vlc.exe"}}, func() map[uint32]procInfo {
		called = true
		return webviewTable()
	})
	if called {
		t.Error("built a process table for a request with no shared runtime")
	}
	if len(reqs[0].Hosts) != 0 {
		t.Error("annotated a plain process with hosts")
	}

	reqs = annotateHosts([]Request{{Exe: "msedgewebview2.exe"}}, func() map[uint32]procInfo {
		return webviewTable()
	})
	if len(reqs[0].Hosts) != 3 {
		t.Errorf("hosts = %v, want all three owners", reqs[0].Hosts)
	}
}

func equalU32(a, b []uint32) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// Live check against this machine: whatever WebView2 trees are running, every
// one of them must resolve to a real owning application rather than to another
// msedgewebview2.exe.
func TestResolveHostAgainstLiveProcesses(t *testing.T) {
	table, err := processTable()
	if err != nil {
		t.Fatalf("processTable: %v", err)
	}

	var webviews int
	for _, p := range table {
		if p.Exe == "msedgewebview2.exe" {
			webviews++
		}
	}
	if webviews == 0 {
		t.Skip("no WebView2 processes running")
	}

	hosts := hostsOf(table, "msedgewebview2.exe")
	t.Logf("%d WebView2 processes owned by %v", webviews, hosts)
	if len(hosts) == 0 {
		t.Fatal("resolved no owners at all for the running WebView2 processes")
	}
	for _, h := range hosts {
		if h == "msedgewebview2.exe" || isGenericHost(h) {
			t.Errorf("owner %q is a runtime, not an application: the walk stopped too early", h)
		}
	}
}
