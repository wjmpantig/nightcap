import type { HTMLAttributes, JSX } from 'react'

/**
 * A process identity cell: mono executable name plus the owner chain nightcap resolved for it.
 */
export interface ProcessNameProps extends HTMLAttributes<HTMLDivElement> {
  /** Image name as powercfg reports it, e.g. "msedgewebview2.exe". */
  exe: string
  /** Owning applications resolved by walking the parent chain. Two or more = shared runtime. */
  hosts?: string[]
  /** Full image path — becomes the tooltip. */
  path?: string
  size?: 'sm' | 'md'
}

export function ProcessName(props: ProcessNameProps): JSX.Element
