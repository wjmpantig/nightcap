import { Lockup } from "@/design/components/brand/Lockup"
import { Badge } from "@/design/components/core/Badge"
import { Panel } from "@/design/components/core/Panel"
import { SectionHeader } from "@/design/components/core/SectionHeader"
import type { Update } from "@/types"
import styles from "./AboutView.module.scss"

interface AboutViewProps {
  /** The release tag, or "dev" for a build from a working tree. */
  version: string
  /** A newer release, if one has been found. */
  update?: Update
}

export function AboutView({ version, update }: AboutViewProps) {
  return (
    <div className="fade-in">
      <Panel pad={false}>
        <SectionHeader title="About" />
        <div className={styles.body}>
          <Lockup size={26} tagline="Wake watcher for Windows and macOS" />
          <dl className={styles.facts}>
            <dt>Version</dt>
            <dd className={styles.mono}>{version}</dd>
            {update?.version && (
              <>
                <dt>Update</dt>
                <dd>
                  <Badge tone="awake" dot>
                    {update.version} available
                  </Badge>
                </dd>
              </>
            )}
            <dt>Author</dt>
            <dd>Winfred Pantig</dd>
          </dl>
        </div>
      </Panel>
    </div>
  )
}
