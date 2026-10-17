import { describe, expect, it } from "vitest"

import {
  ADVANCED_LIMITS,
  buildAdvancedCss,
  DEFAULT_ADVANCED,
  hasAdvancedOverrides,
  isAdvancedColor,
  parseAdvanced,
  serializeAdvanced,
  validateAdvanced,
  type AdvancedNumericKey,
} from "./advanced"

describe("Form & Field Advanced settings", () => {
  it("preserves upstream appearance until an override is selected", () => {
    expect(buildAdvancedCss(DEFAULT_ADVANCED)).toBe("")
    expect(hasAdvancedOverrides(DEFAULT_ADVANCED)).toBe(false)
    expect(buildAdvancedCss(parseAdvanced(undefined))).toBe("")
    expect(buildAdvancedCss(parseAdvanced({ version: 99, bodySize: 18 }))).toBe(
      ""
    )
  })

  it("recovers useful settings and discards malformed values independently", () => {
    const settings = parseAdvanced({
      bodySize: 18,
      containerPadding: "1.2",
      overlayElevation: Number.POSITIVE_INFINITY,
      controlPadding: -1,
      controlHeight: 0,
      controlRadius: -1,
      bodyLeading: 1.7,
      tokens: {
        light: {
          primary: "  #ff6633 ",
          background: "url(https://example.com)",
        },
        dark: [],
      },
    })
    expect(settings.bodySize).toBe(18)
    expect(settings.bodyLeading).toBe(1.7)
    for (const key of [
      "containerPadding",
      "overlayElevation",
      "controlPadding",
      "controlHeight",
      "controlRadius",
    ] as const)
      expect(settings[key]).toBeNull()
    expect(settings.tokens).toEqual({
      light: { primary: "#ff6633" },
      dark: {},
    })
  })

  it("enforces every numeric boundary without accepting coercion or NaN", () => {
    for (const key of Object.keys(ADVANCED_LIMITS) as AdvancedNumericKey[]) {
      const [min, max] = ADVANCED_LIMITS[key]
      expect(parseAdvanced({ [key]: min })[key]).toBe(min)
      expect(parseAdvanced({ [key]: max })[key]).toBe(max)
      for (const invalid of [
        min - 1,
        max + 1,
        NaN,
        Infinity,
        -Infinity,
        String(min),
        {},
        [],
      ]) {
        expect(parseAdvanced({ [key]: invalid })[key]).toBeNull()
      }
    }
  })

  it("rejects fractional elevation levels at both parsing boundaries", () => {
    expect(parseAdvanced({ cardElevation: 1.5 }).cardElevation).toBeNull()
    expect(() =>
      validateAdvanced({ ...DEFAULT_ADVANCED, overlayElevation: 1.5 })
    ).toThrow()
  })

  it("does not share mutable color maps across fresh drafts", () => {
    const a = parseAdvanced(null)
    const b = parseAdvanced(null)
    a.tokens.light.primary = "#123456"
    expect(b.tokens.light).toEqual({})
    expect(DEFAULT_ADVANCED.tokens.light).toEqual({})
  })

  it("rejects inherited properties and arbitrary CSS custom property names", () => {
    const settings = parseAdvanced(
      Object.assign(Object.create({ bodySize: 20 }), {
        tokens: {
          light: Object.assign(Object.create({ primary: "#fff" }), {
            "x; } body { color": "#000",
            radius: "#fff",
          }),
        },
      })
    )
    expect(settings.bodySize).toBeNull()
    expect(settings.tokens.light).toEqual({})
    expect(buildAdvancedCss(settings)).toBe("")
  })

  it("roundtrips the complete independent draft including both modes", () => {
    const settings = parseAdvanced({
      version: 2,
      containerPadding: 20,
      controlHeight: 44,
      overlayElevation: 0,
      tokens: {
        light: { primary: "oklch(0.6 0.2 40)" },
        dark: { primary: "#aabbcc" },
      },
    })
    expect(parseAdvanced(JSON.parse(serializeAdvanced(settings)))).toEqual(
      settings
    )
    expect(hasAdvancedOverrides(settings)).toBe(true)
    expect(serializeAdvanced(settings)).not.toContain("iconLibrary")
    expect(validateAdvanced(JSON.parse(serializeAdvanced(settings)))).toEqual(
      settings
    )
  })

  it("refuses corrupted or incomplete documents at the save boundary", () => {
    expect(validateAdvanced(DEFAULT_ADVANCED)).toEqual(DEFAULT_ADVANCED)
    for (const input of [
      null,
      {},
      { ...DEFAULT_ADVANCED, version: 99 },
      { ...DEFAULT_ADVANCED, bodySize: "18" },
      { ...DEFAULT_ADVANCED, bodySize: undefined },
      { ...DEFAULT_ADVANCED, extra: 1 },
      { ...DEFAULT_ADVANCED, tokens: { light: {} } },
      { ...DEFAULT_ADVANCED, tokens: { light: { radius: "#fff" }, dark: {} } },
      { ...DEFAULT_ADVANCED, tokens: { light: {}, dark: {}, other: {} } },
    ]) {
      expect(() => validateAdvanced(input)).toThrow()
    }
  })

  it("sizes coherent controls without changing root spacing or type", () => {
    const css = buildAdvancedCss(
      parseAdvanced({ controlHeight: 36, controlPadding: 12 })
    )
    expect(css).toContain("height: 36px;")
    expect(css).toContain('[data-slot="button"][data-size="sm"]')
    expect(css).toContain("height: 32px;")
    expect(css).toContain("height: 40px;")
    expect(css).toContain("width: 36px; padding: 0;")
    expect(css).not.toContain("min-height:")
    expect(css).not.toContain("--spacing:")
    expect(css).not.toContain("font-size:")
    expect(buildAdvancedCss(parseAdvanced({ controlHeight: null }))).toBe("")
  })

  it("coordinates card padding while keeping small cards distinct", () => {
    const css = buildAdvancedCss(
      parseAdvanced({ containerPadding: 24, rowSpacing: 12 })
    )
    expect(css).toContain("--card-spacing: 24px;")
    expect(css).toContain("--card-spacing: 18px;")
    expect(css).toContain("row-gap: 12px;")
    expect(css).toContain("padding-block: 6px;")
    expect(css).not.toContain("--spacing:")
  })

  it("uses independent text roles and preserves heading hierarchy", () => {
    const css = buildAdvancedCss(
      parseAdvanced({
        bodySize: 18,
        bodyLeading: 1.8,
        headingSize: 20,
        labelTracking: 0.01,
      })
    )
    expect(css).toContain("font-size: 18px; line-height: 1.8;")
    expect(css).toContain("h1 { font-size: 40px; }")
    expect(css).toContain("h2 { font-size: 30px; }")
    expect(css).toContain("letter-spacing: 0.01em;")
    expect(css).not.toContain("--text-")
    expect(css).not.toContain(":root {")
    expect(css).not.toContain("body,")
  })

  it("separates elevation, preserves rings, and only targets bordered controls", () => {
    const css = buildAdvancedCss(
      parseAdvanced({ cardElevation: 0, fieldBorder: 2 })
    )
    expect(css).toContain("var(--tw-ring-shadow, 0 0 #0000)")
    expect(css).toContain("var(--tw-inset-ring-shadow, 0 0 #0000)")
    expect(css).toContain('[data-slot="button"][data-variant="outline"]')
    expect(css).not.toContain('[data-slot="popover-content"]')
    expect(css).not.toContain(":focus-visible")
    expect(css).not.toContain("outline:")
    expect(
      buildAdvancedCss(parseAdvanced({ overlayElevation: 2 }))
    ).not.toContain('[data-slot="card"]')
  })

  it("separates light and dark colors", () => {
    const css = buildAdvancedCss(
      parseAdvanced({
        tokens: { light: { primary: "#123456" }, dark: { primary: "#abcdef" } },
      })
    )
    expect(css).toContain(":root:not(.dark) {\n  --primary: #123456;\n}")
    expect(css).toContain(".dark {\n  --primary: #abcdef;\n}")
  })

  it("upgrades v1 colors without carrying over unsafe global settings", () => {
    const legacy = {
      version: 1,
      density: 1.2,
      fontSize: 20,
      motion: 2,
      iconSize: 28,
      tokens: { light: { primary: "#123456" }, dark: {} },
    }
    const upgraded = parseAdvanced(legacy)
    expect(upgraded.version).toBe(2)
    expect(upgraded.tokens.light.primary).toBe("#123456")
    const css = buildAdvancedCss(upgraded)
    expect(css).not.toContain("--spacing:")
    expect(css).not.toContain("font-size:")
    expect(css).not.toContain("animation-duration:")
    expect(css).not.toContain("svg")
    expect(() => validateAdvanced(legacy)).toThrow() // Incomplete saves still fail.
    const complete = {
      version: 1,
      ...Object.fromEntries(
        [
          "density",
          "fontSize",
          "lineHeight",
          "letterSpacing",
          "borderWidth",
          "shadow",
          "motion",
          "iconSize",
          "iconStroke",
          "focusRing",
          "buttonHeight",
          "inputHeight",
          "cardPadding",
        ].map((key) => [key, null])
      ),
      tokens: legacy.tokens,
    }
    expect(validateAdvanced(complete)).toEqual(parseAdvanced(complete))
  })

  it("accepts supported color formats and prevents declaration injection at generation", () => {
    for (const color of [
      "#abc",
      "#abcd",
      "#AABBCC",
      "#12345678",
      "rgb(12 34 56 / 40%)",
      "rgba(12, 34, 56, .5)",
      "hsl(180 30% 20%)",
      "oklch(.6 .2 130 / .5)",
      "oklab(0.4 0.2 -0.1)",
      "transparent",
    ])
      expect(isAdvancedColor(color)).toBe(true)
    for (const color of [
      "#ggg",
      "rgb(NaN 0 0)",
      "hsl(20 30 40)",
      "oklch(20% 0.3 30%)",
      "rgb(1, 2%, 3)",
      "var(--primary)",
      "red; } body { display: none }",
      "#fff/*comment*/",
      "url(javascript:alert(1))",
      "rgb(1 2 3 / .2 / .3)",
      "oklch(1, 0, 0)",
    ])
      expect(isAdvancedColor(color)).toBe(false)
    const unsafe = {
      ...DEFAULT_ADVANCED,
      tokens: { light: { primary: "#fff; display: none" }, dark: {} },
    }
    expect(buildAdvancedCss(unsafe)).toBe("")
  })
})
