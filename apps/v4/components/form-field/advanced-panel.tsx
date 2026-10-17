"use client"

import * as React from "react"

import {
  ADVANCED_LIMITS,
  DENSITY_KEYS,
  DENSITY_PRESETS,
  hasAdvancedOverrides,
  isAdvancedColor,
  parseAdvanced,
  type AdvancedMode,
  type AdvancedNumericKey,
  type AdvancedSettings,
  type AdvancedTokenName,
} from "@/lib/form-field/advanced"
import {
  colorContrast,
  type AdvancedMetrics,
} from "@/lib/form-field/advanced-metrics"
import { useFormField } from "@/components/form-field/provider"
import { buildThemeForPreset } from "@/registry/config"

const buttonClass =
  "rounded px-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-40"
const inputClass =
  "h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive"
const summaryClass =
  "cursor-pointer rounded-sm text-xs font-medium select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"

const CONTROLS: Record<
  AdvancedNumericKey,
  { label: string; unit: string; affects: string }
> = {
  bodySize: {
    label: "Body size",
    unit: "px",
    affects:
      "Paragraphs and component descriptions. Other text roles stay independent.",
  },
  bodyWeight: {
    label: "Body weight",
    unit: "",
    affects:
      "Body copy and descriptions; available weights follow the selected font.",
  },
  bodyLeading: {
    label: "Body line height",
    unit: "×",
    affects: "Space between lines of body copy and descriptions.",
  },
  bodyTracking: {
    label: "Body tracking",
    unit: "em",
    affects: "Letter spacing in body copy and descriptions.",
  },
  headingSize: {
    label: "Title size",
    unit: "px",
    affects:
      "Component titles and h4–h6. H1, h2 and h3 use 2×, 1.5× and 1.25× this size.",
  },
  headingWeight: {
    label: "Heading weight",
    unit: "",
    affects:
      "Headings and card/dialog titles; weights follow the heading font.",
  },
  headingLeading: {
    label: "Heading line height",
    unit: "×",
    affects: "Headings and card/dialog titles.",
  },
  headingTracking: {
    label: "Heading tracking",
    unit: "em",
    affects: "Letter spacing in headings and card/dialog titles.",
  },
  labelSize: {
    label: "Label / control size",
    unit: "px",
    affects: "Labels, buttons, inputs, text areas and select triggers.",
  },
  labelWeight: {
    label: "Label / control weight",
    unit: "",
    affects:
      "Labels and control text. Inherited value samples the default button.",
  },
  labelLeading: {
    label: "Label / control line height",
    unit: "×",
    affects:
      "Labels and control text; review multiline labels at small heights.",
  },
  labelTracking: {
    label: "Label / control tracking",
    unit: "em",
    affects: "Letter spacing in labels and control text.",
  },
  controlHeight: {
    label: "Control height",
    unit: "px",
    affects:
      "Default buttons, inputs and selects. Small −4px, extra small −8px, large +4px; icon buttons stay square.",
  },
  controlPadding: {
    label: "Horizontal padding",
    unit: "px",
    affects:
      "Text controls. Small controls use 2px less; icon buttons keep their square sizing.",
  },
  containerPadding: {
    label: "Container padding",
    unit: "px",
    affects:
      "Card outer/section padding and dialogs. Small cards use 75%; existing image and footer treatments remain.",
  },
  rowSpacing: {
    label: "Row / section spacing",
    unit: "px",
    affects:
      "Card section and field-group gaps. Table cells use half this value above and below.",
  },
  controlRadius: {
    label: "Control corners",
    unit: "px",
    affects: "Buttons, inputs, selects, text areas and input groups.",
  },
  cardRadius: {
    label: "Card corners",
    unit: "px",
    affects: "Cards and their header/footer corners.",
  },
  overlayRadius: {
    label: "Overlay corners",
    unit: "px",
    affects: "Dialogs, popovers, menus, selects, comboboxes and hover cards.",
  },
  fieldBorder: {
    label: "Field / outline border",
    unit: "px",
    affects:
      "Fields, input groups, select triggers and outline buttons. Filled, ghost and link buttons retain their treatment.",
  },
  cardElevation: {
    label: "Card elevation",
    unit: "",
    affects: "Card shadows. Existing boundary and focus rings are retained.",
  },
  overlayElevation: {
    label: "Floating elevation",
    unit: "",
    affects:
      "Dialog, popover, menu, select, combobox and hover-card shadows. Inherited value samples a popover.",
  },
}

const COLOR_GROUPS: {
  label: string
  pairs: {
    label: string
    surface: AdvancedTokenName
    text?: AdvancedTokenName
  }[]
}[] = [
  {
    label: "Surfaces",
    pairs: [
      { label: "Page", surface: "background", text: "foreground" },
      { label: "Card", surface: "card", text: "card-foreground" },
      {
        label: "Floating surface",
        surface: "popover",
        text: "popover-foreground",
      },
    ],
  },
  {
    label: "Text & quiet surfaces",
    pairs: [{ label: "Muted", surface: "muted", text: "muted-foreground" }],
  },
  {
    label: "Actions",
    pairs: [
      { label: "Primary", surface: "primary", text: "primary-foreground" },
      {
        label: "Secondary",
        surface: "secondary",
        text: "secondary-foreground",
      },
      { label: "Accent", surface: "accent", text: "accent-foreground" },
      {
        label: "Destructive",
        surface: "destructive",
        text: "destructive-foreground",
      },
    ],
  },
  {
    label: "Borders & focus",
    pairs: [
      { label: "Border", surface: "border" },
      { label: "Input border", surface: "input" },
      { label: "Focus ring", surface: "ring" },
    ],
  },
  {
    label: "Charts",
    pairs: [1, 2, 3, 4, 5].map((i) => ({
      label: `Chart ${i}`,
      surface: `chart-${i}` as AdvancedTokenName,
    })),
  },
  {
    label: "Sidebar",
    pairs: [
      { label: "Sidebar", surface: "sidebar", text: "sidebar-foreground" },
      {
        label: "Sidebar primary",
        surface: "sidebar-primary",
        text: "sidebar-primary-foreground",
      },
      {
        label: "Sidebar accent",
        surface: "sidebar-accent",
        text: "sidebar-accent-foreground",
      },
      { label: "Sidebar border", surface: "sidebar-border" },
      { label: "Sidebar ring", surface: "sidebar-ring" },
    ],
  },
]

/** Optional overrides in the upstream sidebar; all style measurements come from the preview. */
export function AdvancedPanel({
  value,
  onChange,
}: {
  value: AdvancedSettings
  onChange: (value: AdvancedSettings) => void
}) {
  const { document, inherited, migrationNotice } = useFormField()
  const [mode, setMode] = React.useState<AdvancedMode>("light")
  const theme = React.useMemo(
    () => buildThemeForPreset(document.essentials),
    [document.essentials]
  )
  const baseline = theme.cssVars?.[mode] ?? {}
  const effective = (name: AdvancedTokenName) =>
    value.tokens[mode][name] ?? baseline[name] ?? ""
  const density = Object.entries(DENSITY_PRESETS).find(([, preset]) =>
    DENSITY_KEYS.every((key) => value[key] === preset[key])
  )?.[0]
  function updateToken(name: AdvancedTokenName, color: string | undefined) {
    const tokens = { ...value.tokens[mode] }
    if (color === undefined) delete tokens[name]
    else tokens[name] = color
    onChange({ ...value, tokens: { ...value.tokens, [mode]: tokens } })
  }
  const control = (name: AdvancedNumericKey) => (
    <NumericControl
      key={name}
      name={name}
      value={value[name]}
      inherited={inherited[name]}
      onChange={(number) => onChange({ ...value, [name]: number })}
    />
  )
  return (
    <div
      className="min-w-0 px-1 pb-4 text-sm"
      aria-label="Advanced customization"
    >
      <div className="flex items-start justify-between gap-2 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Refine your style. Unset values follow Essentials.
        </p>
        <button
          type="button"
          className={buttonClass + " shrink-0"}
          disabled={!hasAdvancedOverrides(value)}
          onClick={() => onChange(parseAdvanced(null))}
        >
          Reset all
        </button>
      </div>
      {migrationNotice && (
        <p
          role="status"
          className="mb-3 rounded-md border p-2 text-xs leading-relaxed text-muted-foreground"
        >
          {migrationNotice}
        </p>
      )}
      <details className="border-t py-3" open>
        <summary className={summaryClass}>Colors</summary>
        <div className="space-y-4 pt-4">
          <div
            className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1"
            role="group"
            aria-label="Color mode to edit"
          >
            {(["light", "dark"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className="rounded px-2 py-1 text-xs capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:bg-background aria-pressed:shadow-xs"
              >
                {option}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Editing {mode} tokens. Contrast checks use these color pairs;
            preview mode is separate.
          </p>
          {COLOR_GROUPS.map((group, index) => (
            <details
              key={group.label}
              open={index === 0}
              className="rounded-md border p-2.5"
            >
              <summary className={summaryClass}>{group.label}</summary>
              <div className="space-y-4 pt-3">
                {group.pairs.map((pair) => (
                  <div key={pair.surface} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{pair.label}</span>
                      {pair.text && (
                        <span
                          aria-hidden
                          className="rounded border px-2 py-0.5 text-xs"
                          style={{
                            backgroundColor: effective(pair.surface),
                            color: effective(pair.text),
                          }}
                        >
                          Aa
                        </span>
                      )}
                    </div>
                    <ColorControl
                      key={mode + pair.surface}
                      name={pair.surface}
                      value={value.tokens[mode][pair.surface]}
                      inherited={baseline[pair.surface]}
                      onChange={(color) => updateToken(pair.surface, color)}
                    />
                    {pair.text && (
                      <>
                        <ColorControl
                          key={mode + pair.text}
                          name={pair.text}
                          value={value.tokens[mode][pair.text]}
                          inherited={baseline[pair.text]}
                          onChange={(color) => updateToken(pair.text!, color)}
                        />
                        <Contrast
                          text={effective(pair.text)}
                          surface={effective(pair.surface)}
                          canvas={effective("background")}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Hex, rgb, hsl or oklch. Focus color uses the existing ring. Contrast
            is a pair check for normal text, not an accessibility audit of every
            state.
          </p>
          <button
            type="button"
            className={buttonClass}
            disabled={!Object.keys(value.tokens[mode]).length}
            onClick={() =>
              onChange({ ...value, tokens: { ...value.tokens, [mode]: {} } })
            }
          >
            Reset {mode} colors
          </button>
        </div>
      </details>
      <details className="border-t py-3">
        <summary className={summaryClass}>Typography</summary>
        <p className="pt-3 text-xs leading-relaxed text-muted-foreground">
          Font families follow Essentials. Inherited values sample body copy, a
          card title and a default button.
        </p>
        {(
          [
            ["Body", "body"],
            ["Headings", "heading"],
            ["Labels & controls", "label"],
          ] as const
        ).map(([label, role]) => (
          <fieldset key={role} className="space-y-4 pt-4">
            <legend className="pt-4 text-xs font-medium">{label}</legend>
            {(["Size", "Weight", "Leading", "Tracking"] as const).map(
              (suffix) => control(`${role}${suffix}`)
            )}
          </fieldset>
        ))}
      </details>
      <details className="border-t py-3">
        <summary className={summaryClass}>Sizing and spacing</summary>
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs">Density</span>
            <button
              className={buttonClass}
              type="button"
              disabled={DENSITY_KEYS.every((key) => value[key] === null)}
              onClick={() =>
                onChange({
                  ...value,
                  ...Object.fromEntries(DENSITY_KEYS.map((key) => [key, null])),
                })
              }
            >
              Reset density
            </button>
          </div>
          <div
            className="grid grid-cols-3 gap-1"
            role="group"
            aria-label="Density"
          >
            {Object.entries(DENSITY_PRESETS).map(([name, preset]) => (
              <button
                key={name}
                type="button"
                aria-pressed={density === name}
                onClick={() => onChange({ ...value, ...preset })}
                className="rounded-md border py-2 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-foreground aria-pressed:bg-muted"
              >
                {name}
              </button>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {density ??
              (DENSITY_KEYS.every((key) => value[key] === null)
                ? "Inherited from your style"
                : "Custom density")}
            . Changes control sizes, card padding and row gaps together. Fine
            adjustments below.
          </p>
          {DENSITY_KEYS.map(control)}
        </div>
      </details>
      <details className="border-t py-3">
        <summary className={summaryClass}>Surfaces and shape</summary>
        <p className="pt-3 text-xs leading-relaxed text-muted-foreground">
          Corners inherit the style and Essentials radius. Cards and floating
          surfaces have independent elevation.
        </p>
        <div className="space-y-4 pt-4">
          {(
            [
              "controlRadius",
              "cardRadius",
              "overlayRadius",
              "fieldBorder",
              "cardElevation",
              "overlayElevation",
            ] as const
          ).map(control)}
        </div>
      </details>
    </div>
  )
}

function NumericControl({
  name,
  value,
  inherited,
  onChange,
}: {
  name: AdvancedNumericKey
  value: number | null
  inherited: AdvancedMetrics[AdvancedNumericKey]
  onChange: (value: number | null) => void
}) {
  const id = React.useId()
  const definition = CONTROLS[name]
  const [min, max, step] = ADVANCED_LIMITS[name]
  const elevation = name.endsWith("Elevation")
  const levels = ["None", "Low", "Medium", "High"]
  const actual = inherited?.value
  const numericValue =
    value ?? (actual !== null && actual !== undefined ? +actual.toFixed(3) : "")
  const [draft, setDraft] = React.useState(String(numericValue))
  const [error, setError] = React.useState("")
  React.useEffect(() => {
    setDraft(String(numericValue))
    setError("")
  }, [numericValue])
  function commitNumber() {
    if (draft === String(numericValue)) return
    if (!draft.trim()) {
      onChange(null)
      setDraft(String(actual ?? ""))
      setError("")
      return
    }
    const next = Number(draft)
    if (!Number.isFinite(next) || next < min || next > max) {
      setError(`Use a value between ${min} and ${max}.`)
      return
    }
    setError("")
    onChange(next)
  }
  const display =
    value !== null
      ? elevation
        ? levels[Math.round(value)]
        : `${+value.toFixed(3)}${definition.unit}`
      : (inherited?.display ?? "Reading preview…")
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium">
          {definition.label}
        </label>
        <button
          type="button"
          className={buttonClass}
          aria-label={`Reset ${definition.label}`}
          disabled={value === null && draft === String(numericValue) && !error}
          onClick={() => {
            setDraft(
              String(
                actual !== null && actual !== undefined
                  ? +actual.toFixed(3)
                  : ""
              )
            )
            setError("")
            onChange(null)
          }}
        >
          Reset
        </button>
      </div>
      {elevation ? (
        <select
          id={id}
          className={inputClass}
          value={value ?? ""}
          aria-describedby={`${id}-help ${id}-value${error ? ` ${id}-error` : ""}`}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? null : Number(event.target.value)
            )
          }
        >
          <option value="">Inherit style</option>
          {levels.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft}
            placeholder="Waiting for preview"
            className={inputClass + " pr-10"}
            aria-describedby={`${id}-help ${id}-value${error ? ` ${id}-error` : ""}`}
            aria-invalid={!!error}
            onChange={(event) => {
              setDraft(event.target.value)
              setError("")
              const next = event.target.valueAsNumber
              if (Number.isFinite(next) && next >= min && next <= max)
                onChange(next)
            }}
            onBlur={commitNumber}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                commitNumber()
              }
            }}
          />
          <span className="pointer-events-none absolute top-2 right-6 text-xs text-muted-foreground">
            {definition.unit}
          </span>
        </div>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <p
        id={`${id}-value`}
        className="text-[11px] leading-relaxed break-words text-muted-foreground"
      >
        {value === null ? "Inherited" : "Override"} · {display}
        {value !== null && inherited ? ` · Reset to ${inherited.display}` : ""}
      </p>
      <p
        id={`${id}-help`}
        className="text-[11px] leading-relaxed text-muted-foreground"
      >
        {definition.affects}
      </p>
    </div>
  )
}

function Contrast({
  text,
  surface,
  canvas,
}: {
  text: string
  surface: string
  canvas: string
}) {
  const [ratio, setRatio] = React.useState<number | null>(null)
  React.useEffect(() => {
    setRatio(colorContrast(text, surface, canvas))
  }, [text, surface, canvas])
  return (
    <p
      role="status"
      className="text-[11px] leading-relaxed text-muted-foreground"
    >
      {ratio === null
        ? "Contrast unavailable for this pair."
        : `${ratio.toFixed(2)}:1 · ${ratio >= 4.5 ? "AA normal text" : "Below AA for normal text"}`}
    </p>
  )
}

function ColorControl({
  name,
  value,
  inherited,
  onChange,
}: {
  name: AdvancedTokenName
  value: string | undefined
  inherited: string | undefined
  onChange: (value: string | undefined) => void
}) {
  const id = React.useId()
  const [draft, setDraft] = React.useState(value ?? "")
  const [error, setError] = React.useState("")
  React.useEffect(() => {
    setDraft(value ?? "")
    setError("")
  }, [value])
  function commit() {
    const color = draft.trim()
    if (!color) {
      setError("")
      onChange(undefined)
      return
    }
    if (!isAdvancedColor(color) || !CSS.supports("color", color)) {
      setError("Enter a valid hex, rgb, hsl or oklch color.")
      return
    }
    setError("")
    onChange(color)
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[11px] break-words">
          {name}
        </label>
        <button
          type="button"
          className={buttonClass}
          disabled={value === undefined && !draft && !error}
          aria-label={`Reset ${name} color`}
          onClick={() => {
            setDraft("")
            setError("")
            onChange(undefined)
          }}
        >
          Reset
        </button>
      </div>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute top-2 left-2 size-4 rounded-sm border"
          style={{ backgroundColor: value ?? inherited }}
        />
        <input
          id={id}
          type="text"
          spellCheck={false}
          autoComplete="off"
          className={inputClass + " pl-8"}
          placeholder={inherited ?? "Not defined by style"}
          value={draft}
          aria-invalid={!!error}
          aria-describedby={`${id}-source${error ? ` ${id}-error` : ""}`}
          onChange={(event) => {
            setDraft(event.target.value)
            setError("")
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              commit()
            }
          }}
        />
      </div>
      <p
        id={`${id}-source`}
        className="text-[10px] leading-relaxed break-words text-muted-foreground"
      >
        {value
          ? `Override · Reset to ${inherited ?? "unset"}`
          : `Inherited · ${inherited ?? "Not defined by style"}`}
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
