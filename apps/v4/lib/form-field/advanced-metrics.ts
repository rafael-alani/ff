import { type AdvancedNumericKey } from "./advanced"

export type AdvancedMetrics = Partial<
  Record<AdvancedNumericKey, { value: number | null; display: string }>
>

/** Read upstream recipes in the preview, with Advanced temporarily disabled.
 * These inert probes never become interactive examples or exported source.
 */
export function measureAdvancedDefaults(probe: HTMLElement): AdvancedMetrics {
  const metrics: AdvancedMetrics = {}
  const read = (name: string) =>
    getComputedStyle(probe.querySelector(`[data-probe="${name}"]`)!)
  const put = (
    key: AdvancedNumericKey,
    value: number | null,
    display: string
  ) => {
    metrics[key] = { value, display }
  }
  for (const role of ["body", "heading", "label"] as const) {
    const style = read(role)
    const size = parseFloat(style.fontSize)
    const leading = parseFloat(style.lineHeight) / size
    const tracking =
      style.letterSpacing === "normal"
        ? 0
        : parseFloat(style.letterSpacing) / size
    put(`${role}Size`, size, `${size}px`)
    put(`${role}Weight`, parseFloat(style.fontWeight), style.fontWeight)
    put(
      `${role}Leading`,
      Number.isFinite(leading) ? leading : null,
      Number.isFinite(leading) ? `${+leading.toFixed(2)}×` : style.lineHeight
    )
    put(`${role}Tracking`, tracking, `${+tracking.toFixed(3)}em`)
  }
  const button = read("label"),
    card = read("card"),
    overlay = read("overlay"),
    input = read("input")
  for (const [key, value] of [
    ["controlHeight", button.height],
    ["controlPadding", button.paddingInlineStart],
    ["containerPadding", read("content").paddingInlineStart],
    ["rowSpacing", card.rowGap],
    ["controlRadius", button.borderTopLeftRadius],
    ["cardRadius", card.borderTopLeftRadius],
    ["overlayRadius", overlay.borderTopLeftRadius],
    ["fieldBorder", input.borderTopWidth],
  ] as const)
    put(
      key,
      Number.isFinite(parseFloat(value)) ? parseFloat(value) : null,
      value
    )
  // An upstream shadow has no honest numeric position on a new elevation scale.
  put(
    "cardElevation",
    null,
    card.getPropertyValue("--tw-shadow").trim() || "none"
  )
  put(
    "overlayElevation",
    null,
    overlay.getPropertyValue("--tw-shadow").trim() || "none"
  )
  return metrics
}

export function contrastRatio(
  foreground: readonly number[],
  background: readonly number[]
): number {
  const luminance = (rgb: readonly number[]) =>
    rgb.slice(0, 3).reduce((sum, channel, i) => {
      const c = channel / 255
      return (
        sum +
        (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) *
          [0.2126, 0.7152, 0.0722][i]
      )
    }, 0)
  const fg = luminance(foreground),
    bg = luminance(background)
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)
}

/** Browser color conversion supports the same CSS color grammar as the editor. */
export function colorContrast(
  text: string,
  surface: string,
  canvas: string
): number | null {
  if (![text, surface, canvas].every((color) => CSS.supports("color", color)))
    return null
  const context = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true })
  if (!context) return null
  const paint = (colors: string[]) => {
    context.clearRect(0, 0, 1, 1)
    for (const color of colors) {
      context.fillStyle = color
      context.fillRect(0, 0, 1, 1)
    }
    return Array.from(context.getImageData(0, 0, 1, 1).data)
  }
  const bg = paint([canvas, surface])
  const fg = paint([canvas, surface, text])
  if (bg[3] < 255 || fg[3] < 255) return null
  return contrastRatio(fg, bg)
}
