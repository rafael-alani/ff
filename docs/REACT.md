# Consume Form & Field source

Source downloads use the selected official React family/style and a Next.js consumer scaffold. This preserves official examples that depend on `next/image`, `next/link`, fonts, providers and local assets. A ZIP is editable source, not a published Form & Field package.

## Start from a download

In the studio, select the family, style and example, set Essentials and Advanced, and open **Save & download**. Download the selected source or all maintained UI components for that family plus the selected example.

Extract into a new directory, inspect its `README.md`, `package.json`, `SOURCE-MANIFEST.json`, and `form-field.preset.json`, then run:

```sh
npm install
npm run typecheck
npm run build
npm run dev
```

These commands belong to the exported consumer scaffold. The fork itself uses pnpm workspace commands. Required runtime/development dependency versions are recorded in the archive. Package installation requires network access; external example media, where present, also remains network dependent.

## Integrate into an existing project

Inspect the destination's framework, package manager, Tailwind configuration, aliases, styles and local instructions first. Copy the selected files under `src/components/` with their transitive helpers, preserving the archive's `@/` alias or adapting imports deliberately. Install missing dependencies with the host's package manager. Do not replace its package manifest wholesale.

Merge the archive's Tailwind v4 setup and import `src/styles.css` once. It includes the generated `theme.css` and separate `overrides.css`, semantic mappings, animation styles and the upstream style variants needed by compositions. Ensure Tailwind scans copied source. Merge existing semantic variables deliberately so the host has a clear theme owner.

Keep dark mode on the document root for portal-mounted content. Include the relevant providers from the example scaffold. Retain actual font loading; setting a family name alone does not load it. Follow the selected component family's native composition API and client/server boundaries.

Pure primitives may be adapted to another React framework, but an arbitrary official Next.js composition is not automatically framework-independent. The shared CSS is independent of React; the example's routing, image or server assumptions may require changes. Svelte migration is outside this work.

## Protect consumer edits

The retired legacy `scripts/add.mjs` installer is not this fork's installation path. Downloads do not overwrite existing projects automatically. Review a diff before merging newer files, retain local changes, and record the archive's provenance and preset.

After integration, type-check and build the destination, inspect desktop/mobile states, exercise keyboard interaction, and connect only intended actions to the product's APIs. Changing this checkout or merging upstream does not update previously copied source.
