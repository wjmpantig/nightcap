/** Join class names, dropping anything falsy. Every component's className merge goes through this. */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}
