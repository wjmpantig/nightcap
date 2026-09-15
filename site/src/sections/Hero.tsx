import { Badge } from "@/design/components/core/Badge"
import { Button } from "@/design/components/core/Button"
import { links } from "../links"
import { useLatestRelease } from "../useLatestRelease"
import styles from "./Hero.module.scss"

export function Hero() {
  const tag = useLatestRelease()

  return (
    <section className={styles.hero}>
      <div className={styles.badge}>
        <Badge tone="watched" dot>
          {tag ? `${tag} · Windows & macOS` : "Windows & macOS"}
        </Badge>
      </div>

      <h1 className={styles.title}>Let this machine sleep.</h1>

      <p className={styles.lede}>
        Some apps take a power request and forget to let go, so the machine never sleeps. nightcap
        shows you who is doing it, lets you put the repeat offenders on a watchlist, and closes them
        once you have genuinely stopped typing.
      </p>

      <div className={styles.actions} id="download">
        <Button variant="primary" size="lg" icon="download" href={links.windows}>
          Download for Windows
        </Button>
        <Button variant="secondary" size="lg" icon="download" href={links.macos}>
          Download for macOS
        </Button>
      </div>

      <p className={styles.note}>
        Free, and the source is on GitHub. Neither build is code-signed, so the first launch needs a
        nudge past SmartScreen or Gatekeeper. On Windows it asks for administrator rights — reading
        the full list of wake locks needs them.
      </p>
    </section>
  )
}
