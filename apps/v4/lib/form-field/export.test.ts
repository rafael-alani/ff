import { promises as fs } from "node:fs"
import path from "node:path"
import { describe, expect, it, vi } from "vitest"

import { DEFAULT_DOCUMENT } from "./document"
import { buildSourceFiles } from "./export"
import { createZip } from "./zip"

vi.mock("server-only", () => ({}))

describe("Form & Field source export", () => {
  it("bundles the actual nested finance cards and their transitive components", async () => {
    const files = await buildSourceFiles({
      document: DEFAULT_DOCUMENT,
      item: "preview-02",
      scope: "selected",
    })
    expect(
      files.has(
        "src/components/blocks/preview-02/cards/contribution-history.tsx"
      )
    ).toBe(true)
    expect(files.has("src/components/ui/chart.tsx")).toBe(true)
    expect(files.has("src/components/ui/button.tsx")).toBe(true)
    expect(files.has("src/lib/preset.ts")).toBe(true)
    expect(files.get("src/overrides.css")).toBe(
      await fs.readFile("packages/styles/src/overrides.css", "utf8")
    )
    const provenance = JSON.parse(String(files.get("SOURCE-MANIFEST.json")))
    expect(provenance.acceptedUpstreamCommit).toMatch(/^[a-f0-9]{40}$/)
    const source = [...files]
      .filter(([name]) => /\.tsx?$/.test(name))
      .map(([, text]) => String(text))
      .join("\n")
    expect(source).not.toContain("@/registry/bases/")
    expect(source).not.toContain("icon-placeholder")
    expect(source).not.toContain("@/app/")
    expect(String(files.get("src/components/ui/button.tsx"))).not.toContain(
      "cn-button-size-default"
    )
    for (const [name, value] of files) {
      if (!/\.tsx?$/.test(name)) continue
      for (const match of String(value).matchAll(/from ["'](@\/[^"']+)["']/g)) {
        const target = "src/" + match[1].slice(2)
        expect(
          [".ts", ".tsx", "/index.ts", "/index.tsx"].some((suffix) =>
            files.has(target + suffix)
          ),
          `${name}: ${target}`
        ).toBe(true)
      }
      expect(path.isAbsolute(name)).toBe(false)
    }
    const deps = JSON.parse(String(files.get("package.json"))).dependencies
    expect(deps["react-qr-code"]).toBeTruthy()
    expect(deps["recharts"]).toBeTruthy()
    expect(deps["@fontsource-variable/inter"]).toBeTruthy()
    const zip = createZip(files)
    expect(new DataView(zip.buffer).getUint32(0, true)).toBe(0x04034b50)
    expect(new DataView(zip.buffer).getUint16(zip.length - 12, true)).toBe(
      files.size
    )
  }, 60_000)

  it("rejects unknown items", async () => {
    await expect(
      buildSourceFiles({
        document: DEFAULT_DOCUMENT,
        item: "../../package.json",
        scope: "selected",
      })
    ).rejects.toThrow("maintained preview")
  })

  it("includes the official chat demo helpers and local scripted transport", async () => {
    const files = await buildSourceFiles({
      document: DEFAULT_DOCUMENT,
      item: "message-scroller-example",
      scope: "selected",
    })
    expect(files.has("src/lib/ai.ts")).toBe(true)
    expect(String(files.get("src/lib/ai.ts"))).toContain(
      "@shadcn/helpers/ai-sdk"
    )
    expect(
      String(files.get("src/components/examples/message-scroller-example.tsx"))
    ).toContain("chat.transport")
    expect(
      JSON.parse(String(files.get("package.json"))).dependencies[
        "@shadcn/helpers"
      ]
    ).toBeTruthy()
  }, 60_000)
})
