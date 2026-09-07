import { Lockup } from "@/design/components/brand/Lockup"
import { Panel } from "@/design/components/core/Panel"
import { SectionHeader } from "@/design/components/core/SectionHeader"
import styles from "./AboutView.module.scss"

interface AboutViewProps {
  /** The release tag, or "dev" for a build from a working tree. */
  version: string
}

export function AboutView({ version }: AboutViewProps) {
  return (
    <div className="fade-in">
      <Panel pad={false}>
        <SectionHeader title="About" />
        <div className={styles.body}>
          <Lockup size={26} tagline="Wake watcher for Windows and macOS" />
          <dl className={styles.facts}>
            <dt>Version</dt>
            <dd className={styles.mono}>{version}</dd>
            <dt>Author</dt>
            <dd>Winfred Pantig</dd>
          </dl>
        </div>
      </Panel>
    </div>
  )
}
