import type { HTMLAttributes, JSX } from 'react'

export interface IdleMeterProps extends HTMLAttributes<HTMLDivElement> {
  /** Seconds since the last keyboard or mouse input. */
  idleSecs: number
  /** The timeout this meter is filling toward. */
  timeoutMinutes: number
  label?: string
}

export function IdleMeter(props: IdleMeterProps): JSX.Element
