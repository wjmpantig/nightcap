// The generated bindings dereference window.go eagerly:
//
//     window['go']['main']['App']['GetStatus']()
//
// Wails injects that object after the page starts executing, so calling a bound
// method too early throws a synchronous TypeError rather than rejecting. Thrown
// from an effect, that unmounts the React tree and leaves a blank window until a
// manual reload. Everything here exists to make that impossible.

/** Resolves once Wails has injected its bindings and runtime. */
export function whenReady(timeoutMs = 15000): Promise<boolean> {
    const ready = () => Boolean((window as any).go && (window as any).runtime)
    if (ready()) return Promise.resolve(true)

    return new Promise(resolve => {
        const started = Date.now()
        const poll = setInterval(() => {
            if (ready()) {
                clearInterval(poll)
                resolve(true)
            } else if (Date.now() - started > timeoutMs) {
                clearInterval(poll)
                resolve(false)
            }
        }, 50)
    })
}

/**
 * Calls a bound method, converting a synchronous throw into a rejected promise
 * so a missing binding can never escape into React's render cycle.
 */
export function call<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return Promise.resolve(fn())
    } catch (e) {
        return Promise.reject(e)
    }
}
