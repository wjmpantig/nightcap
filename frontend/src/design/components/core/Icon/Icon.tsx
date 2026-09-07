import {
  AlarmClock,
  AppWindow,
  Check,
  ChevronDown,
  Clock,
  Eraser,
  ExternalLink,
  Eye,
  EyeOff,
  GitFork,
  Info,
  Lock,
  LogOut,
  Maximize,
  Moon,
  Pause,
  Play,
  Plus,
  Power,
  RefreshCw,
  Settings,
  ShieldAlert,
  Trash2,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react"
import type { SVGAttributes } from "react"
import { cx } from "@/utils/cx"
import styles from "./Icon.module.scss"

// The glyph source lives in exactly one file: this registry. nightcap is an
// offline desktop app, so the icons are imported from the lucide-react package
// and bundled — never fetched at runtime. Listing them by name instead of
// pulling the whole set is what lets the bundler drop the ~1600 we don't use.
//
// Adding an icon to the UI means adding it here first; IconName is derived from
// this map, so an unregistered name is a compile error rather than a blank box.
const ICONS = {
  "alarm-clock": AlarmClock,
  "app-window": AppWindow,
  check: Check,
  "chevron-down": ChevronDown,
  clock: Clock,
  eraser: Eraser,
  "external-link": ExternalLink,
  eye: Eye,
  "eye-off": EyeOff,
  "git-fork": GitFork,
  info: Info,
  lock: Lock,
  "log-out": LogOut,
  maximize: Maximize,
  moon: Moon,
  pause: Pause,
  play: Play,
  plus: Plus,
  power: Power,
  "refresh-cw": RefreshCw,
  settings: Settings,
  "shield-alert": ShieldAlert,
  "trash-2": Trash2,
  "triangle-alert": TriangleAlert,
  x: X,
  zap: Zap,
} as const

export type IconName = keyof typeof ICONS

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  /** Registered Lucide name in kebab-case, e.g. "moon", "eye", "eye-off". */
  name: IconName
  /** Pixel box. 14 in dense rows, 16 default, 20 in headers. */
  size?: number
  /** Any CSS colour. Defaults to currentColor, so an icon in a danger button turns ember for free. */
  color?: string
}

export function Icon({ name, size = 16, color = "currentColor", className, ...rest }: IconProps) {
  const Glyph = ICONS[name]
  return (
    <Glyph
      className={cx(styles.icon, className)}
      size={size}
      color={color}
      strokeWidth={2}
      aria-hidden={rest["aria-label"] ? undefined : true}
      {...rest}
    />
  )
}
