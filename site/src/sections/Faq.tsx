import styles from "./Faq.module.scss"

const QUESTIONS = [
  {
    q: "Will it close something I am using?",
    a: "Only if you watchlisted it, it is holding a wake lock, and you have been away for the full timeout — and you get a countdown first. Closing is a hard terminate, so unsaved work in a watched app is lost.",
  },
  {
    q: "Does it need administrator rights?",
    a: "On Windows, yes: powercfg only reports the full picture when elevated, so nightcap prompts for it at launch. On macOS it needs nothing — pmset asks no privileges.",
  },
  {
    q: "Can it close a driver or a system service?",
    a: "No. Those wake locks have no process behind them, so they are listed and skipped, and a set of protected names can never be killed no matter what you type into the watchlist.",
  },
  {
    q: "Does it update itself?",
    a: "No. It checks once a day for a newer release and tells you in the window and the tray. Downloading and replacing the binary stays your decision.",
  },
  {
    q: "What does it cost?",
    a: "Nothing. The source is on GitHub.",
  },
]

export function Faq() {
  return (
    <>
      <h2 className={styles.heading}>Questions</h2>
      <div className={styles.list}>
        {QUESTIONS.map((item) => (
          <div className={styles.item} key={item.q}>
            <h3 className={styles.q}>{item.q}</h3>
            <p className={styles.a}>{item.a}</p>
          </div>
        ))}
      </div>
    </>
  )
}
