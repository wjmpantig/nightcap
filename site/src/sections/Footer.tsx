import { Lockup } from "@/design/components/brand/Lockup"
import { links } from "../links"
import styles from "./Footer.module.scss"

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Lockup size={15} />
        <div className={styles.links}>
          <a href="#download">Download</a>
          <a href="#features">Features</a>
          <a href={links.releases}>Releases</a>
          <a href={links.repo}>GitHub</a>
        </div>
        <span>Windows and macOS. Go, Wails and React.</span>
      </div>
    </footer>
  )
}
