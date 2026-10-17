import "server-only"

import { existsSync, promises as fs } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { type RegistryItem } from "shadcn/schema"
import {
  createStyleMap,
  transformDirection,
  transformFont,
  transformIcons,
  transformMenu,
  transformStyle,
} from "shadcn/utils"
import { Node, Project, ScriptKind, SyntaxKind } from "ts-morph"

import { FONT_DEFINITIONS } from "@/lib/font-definitions"
import {
  generateThemeCss,
  getDocumentFontDependencies,
  parseDocument,
  type FormFieldDocument,
} from "@/lib/form-field/document"
import { createZip } from "@/lib/form-field/zip"
import { registry as ariaRegistry } from "@/registry/bases/aria/registry"
import { registry as baseRegistry } from "@/registry/bases/base/registry"
import { registry as radixRegistry } from "@/registry/bases/radix/registry"
import { STYLES } from "@/registry/styles"

export type ExportScope = "selected" | "components"
export type SourceExportRequest = {
  document: FormFieldDocument
  item: string
  scope: ExportScope
  mode?: "light" | "dark"
}

const REGISTRIES = {
  base: baseRegistry,
  radix: radixRegistry,
  aria: ariaRegistry,
}
const APP_ROOT = existsSync(path.join(process.cwd(), "registry/bases"))
  ? process.cwd()
  : path.join(process.cwd(), "apps/v4")
const FORK_ROOT = path.resolve(APP_ROOT, "../..")
const appRequire = createRequire(path.join(APP_ROOT, "package.json"))
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n"
const packageName = (specifier: string) =>
  specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0]

async function readJson(file: string) {
  return JSON.parse(await fs.readFile(file, "utf8"))
}

async function resolveSource(file: string) {
  for (const suffix of [
    "",
    ".tsx",
    ".ts",
    ".jsx",
    ".js",
    "/index.tsx",
    "/index.ts",
  ]) {
    const candidate = file + suffix
    if ((await fs.stat(candidate).catch(() => null))?.isFile()) return candidate
  }
  throw new Error(
    `Source dependency is missing: ${path.relative(APP_ROOT, file)}`
  )
}

async function installedVersion(
  name: string,
  declared: Record<string, string>
) {
  if (name.startsWith("@shadcn/")) {
    const workspace = name.slice("@shadcn/".length)
    return (
      await readJson(
        path.join(FORK_ROOT, "packages", workspace, "package.json")
      )
    ).version as string
  }
  try {
    let dir = path.dirname(appRequire.resolve(name))
    while (dir !== path.dirname(dir)) {
      const metadata = await readJson(path.join(dir, "package.json")).catch(
        () => null
      )
      if (metadata?.name === name) return metadata.version as string
      dir = path.dirname(dir)
    }
  } catch {
    /* Packages with CSS-only exports use the repository's pinned declaration. */
  }
  if (
    name.startsWith("@fontsource/") ||
    name.startsWith("@fontsource-variable/")
  )
    return "^5"
  const version = declared[name]
  if (!version || version.startsWith("workspace:"))
    throw new Error(`Missing dependency version for ${name}`)
  return version
}

function semanticCss() {
  const colors = [
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
  ]
  return `@import "tailwindcss";\n@import "tw-animate-css";\n@import "shadcn/tailwind.css";\n@import "./theme.css";\n@import "./overrides.css";\n@custom-variant dark (&:is(.dark *));\n${STYLES.map((style) => `@custom-variant style-${style.name} (&:where(.style-${style.name} *));`).join("\n")}\n@theme inline {\n  --font-sans: var(--font-sans);\n  --font-heading: var(--font-heading);\n  --font-mono: var(--font-mono);\n  --breakpoint-3xl: 1600px;\n${colors.map((name) => `  --color-${name}: var(--${name});`).join("\n")}\n${Object.entries(
    { sm: 0.6, md: 0.8, lg: 1, xl: 1.4, "2xl": 1.8, "3xl": 2.2, "4xl": 2.6 }
  )
    .map(
      ([name, scale]) => `  --radius-${name}: calc(var(--radius) * ${scale});`
    )
    .join(
      "\n"
    )}\n}\n@layer base {\n  * { @apply border-border outline-ring/50; }\n  body { @apply bg-background text-foreground font-sans; margin: 0; }\n}\n`
}

/** Uses only this checkout's authored source and official style/icon/menu/font/RTL transforms. */
export async function buildSourceFiles(input: SourceExportRequest) {
  const document = parseDocument(input.document)
  if (input.scope !== "selected" && input.scope !== "components")
    throw new Error("Choose selected item or all components")
  const config = document.essentials
  const registry = REGISTRIES[config.base as keyof typeof REGISTRIES]
  if (!registry) throw new Error("The selected primitive base is unavailable")
  const index = new Map<string, RegistryItem>(
    registry.items.map((item) => [item.name, item])
  )
  const selected = index.get(input.item)
  if (
    !selected ||
    !["registry:block", "registry:example", "registry:ui"].includes(
      selected.type
    )
  )
    throw new Error("Choose a maintained preview item")
  const root = path.join(APP_ROOT, "registry/bases", config.base)
  // These upstream chat demos use a local scripted transport, not an API.
  const sharedSourceAliases = new Map([
    ["@/lib/ai", path.join(APP_ROOT, "lib/ai.ts")],
    [
      "@/components/message-parts",
      path.join(APP_ROOT, "components/message-parts.tsx"),
    ],
  ])
  const sharedTargets = new Map(
    [...sharedSourceAliases].map(([alias, source]) => [
      source,
      "src/" + alias.slice(2) + path.extname(source),
    ])
  )
  const sourceFiles = new Map<string, string>()
  const includedItems = new Set<string>()
  const dependencies = new Set([
    "next",
    "react",
    "react-dom",
    "next-themes",
    "tailwindcss",
    "tw-animate-css",
    "shadcn",
    "cn",
    ...getDocumentFontDependencies(document),
  ])
  const assets = new Set<string>()
  const externalReferences = new Set<string>()
  let usesPreset = false
  let usesFonts = false
  let usesStyles = false

  async function visitItem(name: string) {
    if (includedItems.has(name)) return
    const item = index.get(name)
    if (!item)
      throw new Error(
        `Registry dependency ${name} is unavailable in this checkout`
      )
    includedItems.add(name)
    for (const dep of item.dependencies ?? [])
      dependencies.add(packageName(dep.replace(/@[^/]+$/, "")))
    for (const dep of item.registryDependencies ?? []) await visitItem(dep)
    for (const file of item.files ?? [])
      await visitFile(path.join(root, file.path))
  }

  async function visitFile(unresolved: string): Promise<void> {
    const file = await resolveSource(unresolved)
    if (!file.startsWith(root + path.sep) && !sharedTargets.has(file))
      throw new Error("Source path escapes the selected registry")
    if (sourceFiles.has(file)) return
    const content = await fs.readFile(file, "utf8")
    sourceFiles.set(file, content)
    const project = new Project({ useInMemoryFileSystem: true })
    const ast = project.createSourceFile("source.tsx", content, {
      scriptKind: ScriptKind.TSX,
    })
    for (const literal of ast.getImportStringLiterals()) {
      const specifier = literal.getLiteralValue()
      if (specifier.includes("/icon-placeholder")) continue // Official icon transform replaces it.
      if (
        specifier.includes("/create/lib/search-params") ||
        specifier.includes("/(create)/lib/search-params")
      ) {
        usesPreset = true
        continue
      }
      if (specifier.includes("/(create)/lib/fonts")) {
        usesFonts = true
        continue
      }
      if (specifier === "@/registry/styles") {
        usesStyles = true
        continue
      }
      if (specifier.startsWith(`@/registry/bases/${config.base}/`))
        await visitFile(
          path.join(
            root,
            specifier.slice(`@/registry/bases/${config.base}/`.length)
          )
        )
      else if (specifier.startsWith("."))
        await visitFile(path.resolve(path.dirname(file), specifier))
      else if (sharedSourceAliases.has(specifier))
        await visitFile(sharedSourceAliases.get(specifier)!)
      else if (specifier.startsWith("@/"))
        throw new Error(
          `This example needs the upstream app integration (${specifier}). Export another local example; its source remains in registry/bases/${config.base}.`
        )
      else if (!specifier.startsWith("node:"))
        dependencies.add(packageName(specifier))
    }
    for (const match of content.matchAll(
      /["'`](\/(?:[^\s"'`<>]+)\.(?:png|jpe?g|webp|gif|svg|avif|mp4|woff2?)(?:\?[^"'`]*)?)["'`]/g
    ))
      assets.add(match[1].split("?")[0])
    for (const match of content.matchAll(/["'`](https?:\/\/[^\s"'`<>]+)["'`]/g))
      externalReferences.add(match[1])
  }

  await visitItem(selected.name)
  if (input.scope === "components") {
    for (const item of registry.items)
      if (item.type === "registry:ui") await visitItem(item.name)
  }
  const styleMap = createStyleMap(
    await fs.readFile(
      path.join(APP_ROOT, "registry/styles", `style-${config.style}.css`),
      "utf8"
    )
  )
  const files = new Map<string, string | Uint8Array>()
  const targetFor = (source: string) =>
    sharedTargets.get(source) ??
    `src/components/${path.relative(root, source).split(path.sep).join("/")}`
  const aliasFor = (source: string) =>
    "@/" +
    targetFor(source)
      .slice(4)
      .replace(/\.[^.]+$/, "")
  const transformConfig = {
    style: `${config.base}-${config.style}`,
    tsx: true,
    rsc: true,
    iconLibrary: config.iconLibrary,
    rtl: config.rtl,
    menuColor: config.menuColor,
    menuAccent: config.menuAccent,
    tailwind: {
      baseColor: config.baseColor,
      cssVariables: true,
      prefix: "",
      css: "src/styles.css",
      config: "",
    },
    aliases: {
      components: "@/components",
      ui: "@/components/ui",
      lib: "@/components/lib",
      hooks: "@/components/hooks",
      utils: "@/components/lib/utils",
    },
    resolvedPaths: { cwd: "", tailwindCss: "" },
  } as Parameters<typeof transformIcons>[0]["config"]
  for (const [source, raw] of sourceFiles) {
    const styled = await transformStyle(raw, { styleMap })
    const project = new Project({ useInMemoryFileSystem: true })
    const sourceFile = project.createSourceFile("component.tsx", styled, {
      scriptKind: ScriptKind.TSX,
    })
    const opts = {
      filename: source,
      raw: styled,
      sourceFile,
      config: transformConfig,
      supportedFontMarkers: ["cn-font-heading"],
    }
    await transformIcons(opts)
    // Hugeicons narrows SVG strokeWidth to number. Preserve the official SVG
    // Spinner API while adapting its exported value at that library boundary.
    if (
      config.iconLibrary === "hugeicons" &&
      path.relative(root, source) === "ui/spinner.tsx"
    ) {
      const spinner = sourceFile.getFunction("Spinner")
      spinner
        ?.getParameters()[0]
        ?.getNameNode()
        .replaceWithText("{ className, strokeWidth, ...props }")
      for (const element of sourceFile.getDescendantsOfKind(
        SyntaxKind.JsxSelfClosingElement
      )) {
        if (element.getTagNameNode().getText() !== "HugeiconsIcon") continue
        const attr = element.getAttribute("strokeWidth")
        if (attr && Node.isJsxAttribute(attr))
          attr.setInitializer(
            "{strokeWidth === undefined ? 2 : Number(strokeWidth)}"
          )
      }
    }
    // Tabler's Icon ref declaration names its component rather than the SVG
    // element it forwards. Adapt that declaration without dropping consumer refs.
    if (
      config.iconLibrary === "tabler" &&
      path.relative(root, source) === "ui/spinner.tsx"
    ) {
      sourceFile
        .getFunction("Spinner")
        ?.getParameters()[0]
        ?.getNameNode()
        .replaceWithText("{ className, ref, ...props }")
      for (const element of sourceFile.getDescendantsOfKind(
        SyntaxKind.JsxSelfClosingElement
      )) {
        const name = element.getTagNameNode().getText()
        if (name === "IconLoader")
          element.addAttribute({
            name: "ref",
            initializer: `{ref as unknown as React.ComponentProps<typeof ${name}>["ref"]}`,
          })
      }
    }
    await transformMenu(opts)
    await transformFont(opts)
    for (const literal of sourceFile.getImportStringLiterals()) {
      const specifier = literal.getLiteralValue()
      if (specifier.startsWith(`@/registry/bases/${config.base}/`))
        literal.setLiteralValue(
          aliasFor(
            await resolveSource(
              path.join(
                root,
                specifier.slice(`@/registry/bases/${config.base}/`.length)
              )
            )
          )
        )
      else if (specifier.startsWith("."))
        literal.setLiteralValue(
          aliasFor(
            await resolveSource(path.resolve(path.dirname(source), specifier))
          )
        )
      else if (
        specifier.includes("/create/lib/search-params") ||
        specifier.includes("/(create)/lib/search-params")
      )
        literal.setLiteralValue("@/lib/preset")
      else if (specifier.includes("/(create)/lib/fonts"))
        literal.setLiteralValue("@/lib/fonts")
      else if (specifier === "@/registry/styles")
        literal.setLiteralValue("@/lib/styles")
      else if (!specifier.startsWith("@/") && !specifier.startsWith("node:"))
        dependencies.add(packageName(specifier))
    }
    files.set(
      targetFor(source),
      await transformDirection(sourceFile.getText(), config.rtl ?? false)
    )
  }
  if (usesPreset)
    files.set(
      "src/lib/preset.ts",
      `"use client"\nimport { useState } from "react"\nconst preset = ${json(config)}\nexport function useDesignSystemSearchParams() { return useState(preset) }\n`
    )
  if (usesFonts)
    files.set(
      "src/lib/fonts.ts",
      `export const FONTS = ${json(FONT_DEFINITIONS.map((font) => ({ name: font.title, value: font.name, type: font.type })))}\n`
    )
  if (usesStyles)
    files.set(
      "src/lib/styles.ts",
      `export const STYLES = ${json(STYLES.map(({ name, title, description }) => ({ name, title, description })))}\n`
    )
  for (const asset of assets) {
    const local = path.resolve(APP_ROOT, "public", "." + asset)
    if (!local.startsWith(path.join(APP_ROOT, "public") + path.sep))
      throw new Error("Invalid asset path")
    const data = await fs.readFile(local).catch(() => null)
    if (!data) throw new Error(`Required public asset is missing: ${asset}`)
    files.set("public" + asset, data)
  }
  const mainSource = await resolveSource(
    path.join(root, selected.files?.[0]?.path ?? "")
  )
  const mainText = sourceFiles.get(mainSource) ?? ""
  const mainAst = new Project({ useInMemoryFileSystem: true }).createSourceFile(
    "entry.tsx",
    mainText,
    { scriptKind: ScriptKind.TSX }
  )
  const defaultExport = mainAst.getDefaultExportSymbol()
  const namedExport = [...mainAst.getExportedDeclarations().keys()].find(
    (name) => /^[A-Z]/.test(name)
  )
  if (!defaultExport && !namedExport)
    throw new Error("This item has no renderable component export")
  const entryImport = defaultExport
    ? `import Preview from ${JSON.stringify(aliasFor(mainSource))}`
    : `import { ${namedExport} as Preview } from ${JSON.stringify(aliasFor(mainSource))}`
  files.set(
    "src/app/page.tsx",
    `"use client"\n${entryImport}\nexport default function Page() { return <Preview /> }\n`
  )
  const toaster =
    config.base === "base" && sourceFiles.has(path.join(root, "ui/toast.tsx"))
      ? "base"
      : sourceFiles.has(path.join(root, "ui/sonner.tsx"))
        ? "sonner"
        : null
  files.set(
    "src/app/providers.tsx",
    `"use client"\nimport { ThemeProvider, useTheme } from "next-themes"\n${toaster ? `import { Toaster } from "@/components/ui/${toaster === "base" ? "toast" : "sonner"}"` : ""}\nfunction ModeButton() { const { resolvedTheme, setTheme } = useTheme(); return <button type="button" aria-label="Toggle color mode" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} style={{position:"fixed",bottom:16,right:16,zIndex:100,padding:"8px 12px",background:"var(--background)",color:"var(--foreground)",border:"1px solid var(--border)",borderRadius:8}}>Light / dark</button> }\nexport function Providers({children}: {children: React.ReactNode}) { return <ThemeProvider attribute="class" defaultTheme="${input.mode === "dark" ? "dark" : "light"}" enableSystem={false}>{children}<ModeButton />${toaster ? "<Toaster />" : ""}</ThemeProvider> }\n`
  )
  files.set(
    "src/app/layout.tsx",
    `import "../styles.css"\nimport { Providers } from "./providers"\nexport default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="en" dir="${config.rtl ? "rtl" : "ltr"}" suppressHydrationWarning><body className="style-${config.style}"><Providers>{children}</Providers></body></html> }\n`
  )
  files.set("src/styles.css", semanticCss())
  files.set("src/theme.css", generateThemeCss(document))
  const overrides = await fs.readFile(
    path.join(FORK_ROOT, "packages/styles/src/overrides.css"),
    "utf8"
  )
  files.set("src/overrides.css", overrides)
  files.set("form-field.preset.json", json(document))
  files.set(
    "postcss.config.mjs",
    'export default { plugins: { "@tailwindcss/postcss": {} } }\n'
  )
  files.set(
    "next.config.mjs",
    "export default { images: { unoptimized: true } }\n"
  )
  files.set(
    "next-env.d.ts",
    '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n'
  )
  files.set(
    "tsconfig.json",
    json({
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "react-jsx",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] },
      },
      include: [
        "next-env.d.ts",
        "**/*.ts",
        "**/*.tsx",
        ".next/types/**/*.ts",
        ".next/dev/types/**/*.ts",
      ],
      exclude: ["node_modules"],
    })
  )
  const appPackage = await readJson(path.join(APP_ROOT, "package.json"))
  const declared = { ...appPackage.dependencies, ...appPackage.devDependencies }
  const versions: Record<string, string> = {}
  for (const name of [...dependencies].sort())
    versions[name] = await installedVersion(name, declared)
  const devDependencies: Record<string, string> = {}
  for (const name of [
    "@tailwindcss/postcss",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "typescript",
  ])
    devDependencies[name] = await installedVersion(name, declared)
  files.set(
    "package.json",
    json({
      name: "form-field-export",
      version: "1.0.0",
      private: true,
      type: "module",
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        typecheck: "tsc --noEmit",
      },
      dependencies: versions,
      devDependencies,
    })
  )
  files.set(
    "components.json",
    json({
      $schema: "https://ui.shadcn.com/schema.json",
      style: `${config.base}-${config.style}`,
      rsc: true,
      tsx: true,
      iconLibrary: config.iconLibrary,
      tailwind: {
        css: "src/styles.css",
        baseColor: config.baseColor,
        cssVariables: true,
      },
      aliases: transformConfig.aliases,
    })
  )
  files.set(
    "LICENSE.shadcn",
    await fs
      .readFile(path.join(FORK_ROOT, "LICENSE.md"), "utf8")
      .catch(() => fs.readFile(path.join(FORK_ROOT, "LICENSE"), "utf8"))
  )
  const provenance = await readJson(
    path.join(FORK_ROOT, "form-field.upstream.json")
  )
  files.set(
    "SOURCE-MANIFEST.json",
    json({
      migrationBaseline: provenance.migrationBaseline,
      acceptedUpstreamCommit: provenance.acceptedUpstreamCommit,
      generatedBy: "Form & Field",
      source: "https://github.com/shadcn-ui/ui",
      base: config.base,
      style: config.style,
      item: selected.name,
      scope: input.scope,
      registryItems: [...includedItems].sort(),
      sourceFiles: [...sourceFiles.keys()].map((file) =>
        path.relative(APP_ROOT, file)
      ),
      externalReferences: [...externalReferences],
      transformations: [
        "official style",
        "official icons",
        "official menu",
        "official font",
        "official RTL",
        "local import paths",
        ...(config.iconLibrary === "tabler"
          ? ["Tabler SVG ref type adapter"]
          : []),
        ...(config.iconLibrary === "hugeicons"
          ? ["Hugeicons SVG stroke-width adapter"]
          : []),
      ],
    })
  )
  files.set(
    "README.md",
    `# Form & Field source export\n\n${input.scope === "components" ? "All maintained UI components for the selected base, plus the selected example and its dependencies." : "The selected example and its complete local component dependencies."}\n\nSelected preview: **${selected.name}**. Base: **${config.base}**. Style: **${config.style}**.\n\n## Run\n\nUse Node.js 20.18.1 or newer, then run:\n\n\`\`\`sh\nnpm install\nnpm run dev\n\`\`\`\n\nRun \`npm run typecheck\` and \`npm run build\` before integrating. Source is in \`src/components\`; copy the files you need and keep their dependencies. This is a standalone Next.js consumer so official next/image and next/link examples work. It is not a published package.\n\n\`form-field.preset.json\` stores Essentials and Advanced values. \`src/theme.css\` contains generated tokens and advanced overrides. Keep manual CSS in \`src/overrides.css\`. The official component APIs are retained. Adding components with the upstream CLI later does not apply these source files automatically.\n\nDemo actions use local state. They do not persist changes or call financial services. Fontsource packages provide fonts after dependency installation. ${externalReferences.size ? "Some official examples contain external URLs; these are listed in SOURCE-MANIFEST.json, and external images remain network dependent." : "Local public assets referenced by this example are included."}\n\nUpstream source is MIT licensed; see LICENSE.shadcn and SOURCE-MANIFEST.json. Dependency packages retain their own licenses.\n`
  )
  return files
}

export async function buildSourceZip(input: SourceExportRequest) {
  return createZip(await buildSourceFiles(input))
}
