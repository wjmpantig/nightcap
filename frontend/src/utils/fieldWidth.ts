/** width prop -> a CSS length for --field-width. */
export function fieldWidth(width: number | string | undefined) {
  return typeof width === "number" ? `${width}px` : width
}
