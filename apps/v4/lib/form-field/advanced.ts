/** Form & Field's opt-in design layer. Official Essentials remain upstream-owned. */
export const ADVANCED_LIMITS = {
  bodySize: [12, 24, 1],
  bodyWeight: [300, 800, 100],
  bodyLeading: [1.2, 2, 0.05],
  bodyTracking: [-0.05, 0.1, 0.005],
  headingSize: [14, 36, 1],
  headingWeight: [300, 800, 100],
  headingLeading: [1.1, 2, 0.05],
  headingTracking: [-0.05, 0.1, 0.005],
  labelSize: [12, 20, 1],
  labelWeight: [300, 800, 100],
  labelLeading: [1.1, 2, 0.05],
  labelTracking: [-0.05, 0.1, 0.005],
  controlHeight: [28, 56, 1],
  controlPadding: [4, 24, 1],
  containerPadding: [0, 40, 1],
  rowSpacing: [4, 32, 1],
  controlRadius: [0, 24, 1],
  cardRadius: [0, 32, 1],
  overlayRadius: [0, 32, 1],
  fieldBorder: [0, 3, 0.5],
  cardElevation: [0, 3, 1],
  overlayElevation: [0, 3, 1],
} as const

export const DENSITY_PRESETS = {
  Compact: {
    controlHeight: 28,
    controlPadding: 8,
    containerPadding: 12,
    rowSpacing: 8,
  },
  Standard: {
    controlHeight: 36,
    controlPadding: 12,
    containerPadding: 20,
    rowSpacing: 12,
  },
  Comfortable: {
    controlHeight: 44,
    controlPadding: 16,
    containerPadding: 28,
    rowSpacing: 16,
  },
} as const

export const DENSITY_KEYS = [
  "controlHeight",
  "controlPadding",
  "containerPadding",
  "rowSpacing",
] as const

export type AdvancedNumericKey = keyof typeof ADVANCED_LIMITS

export const ADVANCED_TOKEN_NAMES = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "border",
  "input",
  "ring",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
] as const

export type AdvancedTokenName = (typeof ADVANCED_TOKEN_NAMES)[number]
export type AdvancedMode = "light" | "dark"
export type AdvancedTokenOverrides = Partial<Record<AdvancedTokenName, string>>
export type AdvancedSettings = Record<AdvancedNumericKey, number | null> & {
  version: 2
  tokens: Record<AdvancedMode, AdvancedTokenOverrides>
}

// null means "let the selected upstream style decide", rather than a guessed default.
export const DEFAULT_ADVANCED: AdvancedSettings = {
  version: 2,
  ...(Object.fromEntries(
    Object.keys(ADVANCED_LIMITS).map((key) => [key, null])
  ) as Record<AdvancedNumericKey, null>),
  tokens: { light: {}, dark: {} },
}

// v1 exposed global geometry, icon and motion rules. They have no safe equivalent.
const LEGACY_LIMITS = {
  density: [0.75, 1.5],
  fontSize: [12, 20],
  lineHeight: [1.1, 2],
  letterSpacing: [-0.05, 0.1],
  borderWidth: [0, 3],
  shadow: [0, 2],
  motion: [0, 2],
  iconSize: [8, 28],
  iconStroke: [0.25, 3],
  focusRing: [1, 6],
  buttonHeight: [24, 64],
  inputHeight: [24, 64],
  cardPadding: [0, 48],
} as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function own(record: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(record, key)
    ? record[key]
    : undefined
}

/** A deliberately small CSS color grammar: no declarations, variables, or URLs. */
export function isAdvancedColor(value: unknown): value is string {
  if (typeof value !== "string") return false
  const color = value.trim()
  if (color.length > 100) return false
  if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(color))
    return true
  if (/^(transparent|black|white)$/i.test(color)) return true
  const match = color.match(/^(oklch|oklab|rgba?|hsla?)\(([^()]*)\)$/i)
  if (!match) return false
  const name = match[1].toLowerCase()
  const body = match[2].trim()
  const numeric = (part: string) =>
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(part) &&
    Number.isFinite(Number.parseFloat(part))
  let parts: string[]
  let alpha: string | undefined
  if (body.includes(",")) {
    if (name.startsWith("ok") || body.includes("/")) return false
    parts = body.split(",").map((part) => part.trim())
    if (parts.length === 4) alpha = parts.pop()
  } else {
    const slash = body.split("/")
    if (slash.length > 2) return false
    parts = slash[0].trim().split(/\s+/)
    if (slash.length === 2) alpha = slash[1].trim()
  }
  if (parts.length !== 3 || !parts.every(numeric)) return false
  if (alpha !== undefined && !numeric(alpha)) return false
  if (
    name.startsWith("hsl") &&
    (!parts[1].endsWith("%") || !parts[2].endsWith("%"))
  )
    return false
  if (name.startsWith("hsl") && parts[0].endsWith("%")) return false
  if (name === "oklch" && parts[2].endsWith("%")) return false
  if (
    name.startsWith("rgb") &&
    body.includes(",") &&
    new Set(parts.map((part) => part.endsWith("%"))).size > 1
  )
    return false
  return true
}

/** Recover valid fields from storage/imports without trusting their shape or CSS. */
export function parseAdvanced(input: unknown): AdvancedSettings {
  const result: AdvancedSettings = {
    ...DEFAULT_ADVANCED,
    tokens: { light: {}, dark: {} },
  }
  if (!isRecord(input)) return result
  const version = own(input, "version")
  if (version !== undefined && version !== 1 && version !== 2) return result
  for (const key of Object.keys(ADVANCED_LIMITS) as AdvancedNumericKey[]) {
    const value = version === 1 ? null : own(input, key)
    const [min, max] = ADVANCED_LIMITS[key]
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= min &&
      value <= max &&
      (!key.endsWith("Elevation") || Number.isInteger(value))
    ) {
      result[key] = value
    }
  }
  const tokens = own(input, "tokens")
  if (!isRecord(tokens)) return result
  for (const mode of ["light", "dark"] as const) {
    const overrides = own(tokens, mode)
    if (!isRecord(overrides)) continue
    for (const name of ADVANCED_TOKEN_NAMES) {
      const value = own(overrides, name)
      if (isAdvancedColor(value)) result.tokens[mode][name] = value.trim()
    }
  }
  return result
}

/** Strict save/import boundary; corrupted documents must not overwrite a valid preset. */
export function validateAdvanced(input: unknown): AdvancedSettings {
  if (!isRecord(input) || ![1, 2].includes(own(input, "version") as number))
    throw new Error("Unsupported Advanced settings version.")
  const limits: Record<string, readonly number[]> =
    own(input, "version") === 1 ? LEGACY_LIMITS : ADVANCED_LIMITS
  const numericKeys = Object.keys(limits)
  const allowed = new Set<string>(["version", "tokens", ...numericKeys])
  if (Object.keys(input).some((key) => !allowed.has(key)))
    throw new Error("Unknown Advanced setting.")
  for (const key of numericKeys) {
    const value = own(input, key)
    const [min, max] = limits[key]
    if (
      value !== null &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < min ||
        value > max ||
        (key.endsWith("Elevation") && !Number.isInteger(value)))
    ) {
      throw new Error(`Invalid Advanced setting: ${key}.`)
    }
  }
  const tokens = own(input, "tokens")
  if (
    !isRecord(tokens) ||
    Object.keys(tokens).some((mode) => mode !== "light" && mode !== "dark")
  )
    throw new Error("Invalid Advanced color modes.")
  for (const mode of ["light", "dark"] as const) {
    const overrides = own(tokens, mode)
    if (!isRecord(overrides))
      throw new Error(`Invalid Advanced ${mode} colors.`)
    for (const [name, color] of Object.entries(overrides)) {
      if (
        !(ADVANCED_TOKEN_NAMES as readonly string[]).includes(name) ||
        !isAdvancedColor(color)
      )
        throw new Error(`Invalid Advanced ${mode} color: ${name}.`)
    }
  }
  return parseAdvanced(input)
}

export function hasAdvancedOverrides(settings: AdvancedSettings): boolean {
  const parsed = parseAdvanced(settings)
  return (
    (Object.keys(ADVANCED_LIMITS) as AdvancedNumericKey[]).some(
      (key) => parsed[key] !== null
    ) ||
    Object.keys(parsed.tokens.light).length > 0 ||
    Object.keys(parsed.tokens.dark).length > 0
  )
}

/** Stable JSON suitable for a saved draft or the Advanced section of an export. */
export function serializeAdvanced(settings: AdvancedSettings): string {
  return JSON.stringify(parseAdvanced(settings), null, 2) + "\n"
}

/**
 * Append after the official theme in the preview document or consumer CSS.
 * Do not put this global CSS in the studio shell: its controls retain upstream styling.
 */
export function buildAdvancedCss(settings: AdvancedSettings): string {
  const a = parseAdvanced(settings)
  const rules: string[] = []
  const tokens = (mode: AdvancedMode) =>
    Object.entries(a.tokens[mode])
      .map(([name, value]) => `  --${name}: ${value};`)
      .join("\n")
  // Keep light-only edits out of the official dark theme, even when no dark edit exists.
  if (Object.keys(a.tokens.light).length)
    rules.push(`:root:not(.dark) {\n${tokens("light")}\n}`)
  if (Object.keys(a.tokens.dark).length)
    rules.push(`.dark {\n${tokens("dark")}\n}`)
  const rule = (selector: string, declarations: string[]) => {
    if (declarations.length)
      rules.push(`${selector} { ${declarations.join(" ")} }`)
  }
  const typeRoles = {
    body: 'p, [data-slot="card-description"], [data-slot="dialog-description"], [data-slot="alert-dialog-description"], [data-slot="field-description"]',
    heading:
      'h1, h2, h3, h4, h5, h6, [data-slot="card-title"], [data-slot="dialog-title"], [data-slot="alert-dialog-title"]',
    label:
      'label, [data-slot="label"], [data-slot="field-label"], [data-slot="button"], [data-slot="input"], [data-slot="textarea"], [data-slot="select-trigger"]',
  }
  for (const role of ["body", "heading", "label"] as const) {
    const declarations: string[] = []
    for (const [suffix, property, unit] of [
      ["Size", "font-size", "px"],
      ["Weight", "font-weight", ""],
      ["Leading", "line-height", ""],
      ["Tracking", "letter-spacing", "em"],
    ] as const) {
      const value = a[`${role}${suffix}`]
      if (value !== null) declarations.push(`${property}: ${value}${unit};`)
    }
    rule(typeRoles[role], declarations)
  }
  if (a.headingSize !== null) {
    // Component titles establish the base; document headings retain a hierarchy.
    for (const [tag, scale] of [
      ["h1", 2],
      ["h2", 1.5],
      ["h3", 1.25],
    ] as const)
      rule(tag, [`font-size: ${a.headingSize * scale}px;`])
  }
  const controls =
    '[data-slot="button"], [data-slot="input"], [data-slot="select-trigger"]'
  if (a.controlHeight !== null) {
    rule(controls, [`height: ${a.controlHeight}px;`])
    for (const [size, delta] of [
      ["xs", -8],
      ["sm", -4],
      ["default", 0],
      ["lg", 4],
    ] as const) {
      const height = a.controlHeight + delta
      const icon = size === "default" ? "icon" : `icon-${size}`
      rule(
        `[data-slot="button"][data-size="${size}"], [data-slot="select-trigger"][data-size="${size}"]`,
        [`height: ${height}px;`]
      )
      rule(`[data-slot="button"][data-size="${icon}"]`, [
        `height: ${height}px;`,
        `width: ${height}px;`,
        "padding: 0;",
      ])
    }
    // Group inputs fill their wrapper; changing only the nested input clips it.
    rule(
      '[data-slot="input-group"]:not(:has([data-slot="textarea"])):not(:has([data-align^="block-"]))',
      [`height: ${a.controlHeight}px;`]
    )
    rule('[data-slot="input-group"] [data-slot="input"]', ["height: 100%;"])
  }
  if (a.controlPadding !== null) {
    rule(
      '[data-slot="button"]:not([data-size^="icon"]), [data-slot="input"], [data-slot="select-trigger"], [data-slot="textarea"]',
      [`padding-inline: ${a.controlPadding}px;`]
    )
    rule(
      '[data-slot="button"][data-size="sm"], [data-slot="button"][data-size="xs"], [data-slot="select-trigger"][data-size="sm"]',
      [`padding-inline: ${Math.max(2, a.controlPadding - 2)}px;`]
    )
  }
  if (a.containerPadding !== null) {
    // Official card-spacing coordinates outer padding, sections and footer padding.
    rule('[data-slot="card"]', [`--card-spacing: ${a.containerPadding}px;`])
    rule('[data-slot="card"][data-size="sm"]', [
      `--card-spacing: ${a.containerPadding * 0.75}px;`,
    ])
    rule('[data-slot="dialog-content"]', [`padding: ${a.containerPadding}px;`])
  }
  if (a.rowSpacing !== null) {
    rule('[data-slot="card"], [data-slot="field-group"]', [
      `row-gap: ${a.rowSpacing}px;`,
    ])
    rule('[data-slot="table-cell"], [data-slot="table-head"]', [
      `padding-block: ${a.rowSpacing / 2}px;`,
    ])
  }
  const overlays =
    '[data-slot="popover-content"], [data-slot="dialog-content"], [data-slot="alert-dialog-content"], [data-slot="dropdown-menu-content"], [data-slot="context-menu-content"], [data-slot="select-content"], [data-slot="combobox-content"], [data-slot="hover-card-content"]'
  if (a.controlRadius !== null)
    rule(`${controls}, [data-slot="textarea"], [data-slot="input-group"]`, [
      `border-radius: ${a.controlRadius}px;`,
    ])
  if (a.cardRadius !== null) {
    rule('[data-slot="card"]', [`border-radius: ${a.cardRadius}px;`])
    rule('[data-slot="card-header"]', [
      "border-start-start-radius: inherit;",
      "border-start-end-radius: inherit;",
    ])
    rule('[data-slot="card-footer"]', [
      "border-end-start-radius: inherit;",
      "border-end-end-radius: inherit;",
    ])
  }
  if (a.overlayRadius !== null)
    rule(overlays, [`border-radius: ${a.overlayRadius}px;`])
  if (a.fieldBorder !== null)
    rule(
      '[data-slot="input"]:not([data-slot="input-group"] *), [data-slot="textarea"]:not([data-slot="input-group"] *), [data-slot="input-group"], [data-slot="select-trigger"], [data-slot="button"][data-variant="outline"]',
      [`border-width: ${a.fieldBorder}px;`]
    )
  for (const [key, selector] of [
    ["cardElevation", '[data-slot="card"]'],
    ["overlayElevation", overlays],
  ] as const) {
    const level = a[key]
    if (level === null) continue
    const shadow = [
      "0 0 #0000",
      "0 1px 3px rgb(0 0 0 / 0.1)",
      "0 4px 12px rgb(0 0 0 / 0.12)",
      "0 12px 32px rgb(0 0 0 / 0.18)",
    ][Math.round(level)]
    // Replace only elevation. Tailwind's existing focus and boundary rings survive.
    rule(selector, [
      `--ff-surface-shadow: ${shadow};`,
      "box-shadow: var(--tw-inset-shadow, 0 0 #0000), var(--tw-inset-ring-shadow, 0 0 #0000), var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--ff-surface-shadow);",
    ])
  }
  return rules.length
    ? `/* Form & Field Advanced overrides. Official Essentials remain upstream-owned. */\n${rules.join("\n\n")}\n`
    : ""
}
