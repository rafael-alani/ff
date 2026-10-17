import { describe, expect, it } from "vitest"

import { buildThemeForPreset } from "@/registry/config"

import {
  DEFAULT_DOCUMENT,
  generateThemeCss,
  getDocumentFontDependencies,
  parseDocument,
} from "./document"

describe("Form & Field preset document", () => {
  it("starts with the official showcase route rather than the registry placeholder", () => {
    expect(DEFAULT_DOCUMENT.essentials.item).toBe("preview-02")
  })

  it("round-trips complete Essentials and Advanced settings", () => {
    const document = structuredClone(DEFAULT_DOCUMENT)
    document.essentials.base = "aria"
    document.advanced.controlHeight = 48
    document.advanced.tokens.dark.primary = "#abcdef"
    expect(parseDocument(JSON.parse(JSON.stringify(document)))).toEqual(
      document
    )
  })

  it("rejects invalid documents instead of silently resetting them", () => {
    expect(() =>
      parseDocument({
        ...DEFAULT_DOCUMENT,
        essentials: { ...DEFAULT_DOCUMENT.essentials, item: "../../secret" },
      })
    ).toThrow("registry item name")
    expect(() => parseDocument({ ...DEFAULT_DOCUMENT, version: 2 })).toThrow()
    expect(() => parseDocument({ ...DEFAULT_DOCUMENT, advanced: {} })).toThrow()
    expect(() =>
      parseDocument({
        ...DEFAULT_DOCUMENT,
        essentials: { ...DEFAULT_DOCUMENT.essentials, base: "invented" },
      })
    ).toThrow()
    expect(() =>
      parseDocument({
        ...DEFAULT_DOCUMENT,
        advanced: { ...DEFAULT_DOCUMENT.advanced, controlHeight: -1 },
      })
    ).toThrow()
    expect(() =>
      parseDocument({
        ...DEFAULT_DOCUMENT,
        advanced: {
          ...DEFAULT_DOCUMENT.advanced,
          tokens: { light: { primary: "red; color: blue" }, dark: {} },
        },
      })
    ).toThrow()
  })

  it("uses official theme values and appends Advanced values after them", () => {
    const document = structuredClone(DEFAULT_DOCUMENT)
    document.advanced.tokens.light.primary = "#123456"
    document.advanced.controlHeight = 48
    const css = generateThemeCss(document)
    const primary = buildThemeForPreset(document.essentials).cssVars?.light
      ?.primary
    expect(css).toContain(`--primary: ${primary};`)
    expect(css.indexOf("--primary: #123456;")).toBeGreaterThan(
      css.indexOf(`--primary: ${primary};`)
    )
    expect(css).toContain("height: 48px")
    expect(css).toContain(".dark {")
  })

  it("includes portable font imports and deduplicates shared body/heading fonts", () => {
    const document = structuredClone(DEFAULT_DOCUMENT)
    document.essentials.font = "geist"
    document.essentials.fontHeading = "geist"
    expect(getDocumentFontDependencies(document)).toEqual([
      "@fontsource-variable/geist",
    ])
    const css = generateThemeCss(document)
    expect(css).toContain('@import "@fontsource-variable/geist";')
    expect(css).toContain("--font-heading: 'Geist Variable', sans-serif;")
    expect(css).toContain(
      "--font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;"
    )
    expect(css.indexOf("@import")).toBeLessThan(css.indexOf(":root"))
  })
})
