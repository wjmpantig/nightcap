import type { JSX, SVGAttributes } from 'react'

/**
 * The nightcap mark — a moon setting behind a horizon bar. Geometry is fixed; never redraw it.
 */
export interface MarkProps extends SVGAttributes<SVGSVGElement> {
  /** Pixel box. Minimum 16 in a tray, 20 anywhere else. */
  size?: number
  /** solid inherits currentColor · duotone is moonlight disc + amber horizon · outline is a hollow moon. */
  variant?: 'solid' | 'duotone' | 'outline'
  /** inactive sinks the moon to a sliver — used for "paused" / dimmed tray states. */
  state?: 'active' | 'inactive'
  /** Supplying a title makes it an accessible image instead of decoration. */
  title?: string
}

export function Mark(props: MarkProps): JSX.Element
