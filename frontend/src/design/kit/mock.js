// Fake data shaped exactly like the Go backend's Status/Config payloads.
// The design project shipped this as window globals for its Babel preview;
// here it is a plain module.
export const REQUESTS = [
  {exe:'vlc.exe', path:'C:\Program Files\VideoLAN\VLC\vlc.exe', category:'DISPLAY',
   reason:'Video playback in progress.', hosts:[]},
  {exe:'msedgewebview2.exe', path:'C:\Program Files (x86)\Microsoft\EdgeWebView\msedgewebview2.exe',
   category:'EXECUTION', reason:'Media playback', hosts:['Widgets.exe','GoogleDriveFS.exe']},
  {exe:'Teams.exe', path:'C:\Users\sam\AppData\Local\Microsoft\Teams\Teams.exe',
   category:'EXECUTION', reason:'A call is in progress.', hosts:[]},
  {exe:'steam.exe', path:'C:\Program Files (x86)\Steam\steam.exe', category:'SYSTEM',
   reason:'Downloading content.', hosts:[]},
  {exe:'', path:'', category:'DRIVER', reason:'An audio stream is active. (Realtek HD Audio)', hosts:[]},
  {exe:'', path:'', category:'DRIVER', reason:'Legacy kernel caller', hosts:[]},
]

export const WATCHLIST = [
  {exe:'vlc.exe', timeoutMinutes:0, snoozedUntil:''},
  {exe:'Widgets.exe', timeoutMinutes:5, snoozedUntil:''},
  {exe:'Teams.exe', timeoutMinutes:0, snoozedUntil:new Date(Date.now()+3.66*3600e3).toISOString()},
  {exe:'steam.exe', timeoutMinutes:45, snoozedUntil:''},
]

export const HISTORY = [
  {exe:'vlc.exe', at:'2026-08-28T02:14:00', idleSecs:1320, category:'DISPLAY', reason:'Video playback in progress.'},
  {exe:'Widgets.exe', at:'2026-08-27T03:41:00', idleSecs:960, category:'EXECUTION', reason:'Media playback'},
  {exe:'steam.exe', at:'2026-08-26T04:02:00', idleSecs:2760, category:'SYSTEM', reason:'Downloading content.'},
  {exe:'vlc.exe', at:'2026-08-25T01:58:00', idleSecs:900, category:'DISPLAY', reason:'Video playback in progress.'},
]

export const SNOOZE_OPTIONS = [
  {value:15,label:'15 minutes'},{value:60,label:'1 hour'},{value:240,label:'4 hours'},
  {value:480,label:'8 hours'},{value:-1,label:'Until I un-snooze'},
]

export function mmss(secs) {
  const s = Math.max(0, Math.round(secs))
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

export function humanRemaining(ms) {
  const m = Math.round(ms / 60000)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${Math.max(1, m)}m`
}

export function whenKilled(iso) {
  const d = new Date(iso)
  const t = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
  return `${d.toLocaleDateString([], {month:'short', day:'numeric'})} ${t}`
}
