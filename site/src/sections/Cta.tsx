import { Button } from "@/design/components/core/Button"
import { links } from "../links"
import styles from "./Cta.module.scss"

export function Cta() {
  return (
    <div className={styles.cta}>
      <h2 className={styles.heading}>Put the machine to bed.</h2>
      <div className={styles.actions}>
        <Button variant="primary" size="lg" icon="download" href={links.releases}>
          Get nightcap
        </Button>
        <Button variant="ghost" size="lg" iconRight="external-link" href={links.repo}>
          Read the source
        </Button>
      </div>
    </div>
  )
}
