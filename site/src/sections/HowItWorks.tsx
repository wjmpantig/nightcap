import styles from "./HowItWorks.module.scss"

const STEPS = [
  {
    n: "01",
    title: "See what is awake",
    body: "nightcap reads the wake locks your machine is actually holding — powercfg on Windows, pmset on macOS — and names the process behind each one. When a shared runtime makes the owner ambiguous, it says so rather than guessing.",
  },
  {
    n: "02",
    title: "Watchlist the repeat offenders",
    body: "Put an app on the watchlist and give it an idle timeout. Drivers and system services have no process to close and are listed but never touched, and nightcap refuses to watch a shared runtime by name.",
  },
  {
    n: "03",
    title: "Walk away",
    body: "Once you have been idle past the timeout you get a countdown, then the app is closed. Termination is a hard kill: unsaved work in a watched app is lost, which is why you choose what goes on the list.",
  },
]

export function HowItWorks() {
  return (
    <>
      <h2 className={styles.heading}>Three steps, then you forget it exists.</h2>
      <div className={styles.grid}>
        {STEPS.map((step) => (
          <div className={styles.step} key={step.n}>
            <span className={styles.n}>{step.n}</span>
            <h3 className={styles.title}>{step.title}</h3>
            <p className={styles.body}>{step.body}</p>
          </div>
        ))}
      </div>
    </>
  )
}
