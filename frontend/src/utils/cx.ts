import clsx from "clsx"
import type { ClassValue } from "clsx"

/**
 * The className merge every component uses. A thin wrap around clsx so the
 * dependency is named in exactly one place: if it ever needs swapping (for
 * tailwind-merge, say) this is the only signature that has to hold.
 */
export function cx(...parts: ClassValue[]) {
  return clsx(parts)
}
