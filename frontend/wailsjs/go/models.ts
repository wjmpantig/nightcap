export namespace main {
	
	export class KillRecord {
	    exe: string;
	    // Go type: time
	    at: any;
	    idleSecs: number;
	    category: string;
	    reason: string;
	
	    static createFrom(source: any = {}) {
	        return new KillRecord(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.exe = source["exe"];
	        this.at = this.convertValues(source["at"], null);
	        this.idleSecs = source["idleSecs"];
	        this.category = source["category"];
	        this.reason = source["reason"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class WatchEntry {
	    exe: string;
	    timeoutMinutes: number;
	    // Go type: time
	    snoozedUntil: any;
	
	    static createFrom(source: any = {}) {
	        return new WatchEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.exe = source["exe"];
	        this.timeoutMinutes = source["timeoutMinutes"];
	        this.snoozedUntil = this.convertValues(source["snoozedUntil"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Config {
	    defaultTimeoutMinutes: number;
	    warningSeconds: number;
	    watchlist: WatchEntry[];
	    autostart: boolean;
	    paused: boolean;
	    history: KillRecord[];
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.defaultTimeoutMinutes = source["defaultTimeoutMinutes"];
	        this.warningSeconds = source["warningSeconds"];
	        this.watchlist = this.convertValues(source["watchlist"], WatchEntry);
	        this.autostart = source["autostart"];
	        this.paused = source["paused"];
	        this.history = this.convertValues(source["history"], KillRecord);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Request {
	    category: string;
	    kind: string;
	    exe: string;
	    path: string;
	    reason: string;
	    hosts: string[];
	
	    static createFrom(source: any = {}) {
	        return new Request(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.category = source["category"];
	        this.kind = source["kind"];
	        this.exe = source["exe"];
	        this.path = source["path"];
	        this.reason = source["reason"];
	        this.hosts = source["hosts"];
	    }
	}
	export class pending {
	    exe: string;
	    // Go type: time
	    deadline: any;
	
	    static createFrom(source: any = {}) {
	        return new pending(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.exe = source["exe"];
	        this.deadline = this.convertValues(source["deadline"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Status {
	    requests: Request[];
	    idleSecs: number;
	    fullscreen: boolean;
	    pending: pending[];
	    error: string;
	    warning: string;
	
	    static createFrom(source: any = {}) {
	        return new Status(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.requests = this.convertValues(source["requests"], Request);
	        this.idleSecs = source["idleSecs"];
	        this.fullscreen = source["fullscreen"];
	        this.pending = this.convertValues(source["pending"], pending);
	        this.error = source["error"];
	        this.warning = source["warning"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Update {
	    version: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new Update(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.url = source["url"];
	    }
	}
	

}

