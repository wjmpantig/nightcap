import { Lockup } from "@/design/components/brand/Lockup"
import { links } from "../links"
import styles from "./Header.module.scss"

export function Header() {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#top" aria-label="nightcap">
        <Lockup size={22} />
      </a>
      <nav className={styles.nav}>
        <a href="#how">How it works</a>
        <a href="#features">Features</a>
        <a href="#download">Download</a>
        <a href={links.repo}>Source</a>
      </nav>
    </header>
  )
}
