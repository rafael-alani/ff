# Presets, Advanced controls and shared styles

Official Essentials remain validated by `apps/v4/registry/config.ts`. Form & Field's separate Advanced model lives in `apps/v4/lib/form-field/advanced.ts`. The complete document in `document.ts` contains `version`, `essentials`, and `advanced`.

## File contract

| File                                 | Purpose                                                         |
| ------------------------------------ | --------------------------------------------------------------- |
| `packages/styles/src/preset.json`    | Saved complete Essentials + Advanced document.                  |
| `packages/styles/src/theme.css`      | Generated official theme, fonts and optional Advanced CSS.      |
| `packages/styles/src/overrides.css`  | Manually maintained custom CSS; never replaced by preset saves. |
| `packages/styles/src/styles.css`     | Consumer entry and shared semantic mappings.                    |
| `packages/styles/legacy-preset.json` | Original standalone-studio preset retained for reference.       |

Use `generateThemeCss` in `apps/v4/lib/form-field/document.ts` for saved/exported themes. Do not hand-edit `theme.css` as durable customization. Keep durable rules in `overrides.css`; current exports include that file separately.

## Neutral Advanced values

Advanced v2 has four groups: Colors, Typography, Sizing and spacing, and Surfaces and shape. All numerical controls start at `null`; `buildAdvancedCss(DEFAULT_ADVANCED)` returns an empty string. Reset is available per control, per color mode, for density, and for the entire Advanced layer.

- **Colors** groups surface/foreground pairs, muted text, actions, borders/focus, charts and sidebar tokens. Light and dark maps remain independent. Swatches show the selected or inherited color. Contrast feedback converts CSS colors through the browser's sRGB canvas, composites alpha over the page background, and compares the pair against 4.5:1 for normal text. Undefined tokens or translucent page backgrounds have no reported ratio. This is a pair check, not a claim about all hover/disabled/inverted states.
- **Typography** separates paragraphs/descriptions, headings/component titles, and labels/control text. Each role has size, weight, line height and tracking. Essentials owns font families. Component title size is the base for h4–h6; h1/h2/h3 use 2×/1.5×/1.25×. These explicit role overrides replace typography on their documented targets; other example text stays source-owned. Root font size and Tailwind text/spacing tokens are never rewritten.
- **Sizing and spacing** offers Compact (28/8/12/8px), Standard (36/12/20/12px), and Comfortable (44/16/28/16px), in control-height/control-padding/container-padding/row-gap order. These are explicit design choices, not aliases for the inherited style. Fine adjustments are optional. Buttons, inputs and selects share a default height; small/extra-small/large controls use −4/−8/+4px. Icon buttons stay square. The official `--card-spacing` coordinates outer/section/footer padding and retains small cards at 75%; density never changes `--spacing`.
- **Surfaces and shape** separates control/card/overlay radii and card/floating elevation. Border width affects fields, input groups, select triggers and outline buttons only. Elevation retains Tailwind boundary and focus rings. The ring color customizes the existing focus treatment; no second outline is added. Icons and motion remain owned by upstream.

Numeric inheritance is measured from inert official `cn-*` recipes inside the preview, with Advanced disabled only during the synchronous read. Measurements update with Essentials, fonts and viewport changes. Values describe representative body copy, a default button, a default card/title, input and popover; individual source variants can differ. Upstream shadows are shown as their actual CSS value with an explicit inherit option, never positioned on a guessed numeric scale. The hidden measurement markup is neither interactive nor included in exports.

Semantic colors use the official theme builder for both modes. Only known roles and a bounded color grammar are accepted. Color edits commit on blur or Enter after validation. `parseAdvanced` recovers valid fields from browser drafts; `validateAdvanced` rejects malformed complete documents at save/import boundaries. A valid v1 Advanced document migrates its colors to v2 and resets retired numerical settings, whose global semantics have no safe equivalent. Browser migration retains the original JSON under `form-field-fork-draft-v1-before-advanced-v2` and shows a notice; importing a v1 complete preset also reports the reset. Keep original preset files if the old appearance must be reproduced.

Generated CSS is applied inside the preview document, not the studio shell, and is also appended to saved/exported themes. The only new primitive integration adds `data-size` and `data-variant` to the authored Base UI button, matching Radix and React Aria. Regenerate every family/style after changing it.

## Draft, save and export

The `form-field-fork-draft-v1` browser key holds a complete local draft. Official URL state remains authoritative for Essentials when a URL supplies settings. The Advanced iframe channel checks origin and source and synchronizes after the preview is ready. Browser drafts do not change files.

In local development, `/api/form-field/styles` reads a revision and accepts a validated document plus that revision. Save verifies the local request, checks conflicts, rejects overlapping operations, backs up the previous preset/theme pair under `.studio/backups/`, and replaces each file via rename with rollback on caught failures. The two-file update is not crash-atomic. Manual overrides remain untouched. Follow [save diagnostics and pair recovery](OPERATIONS.md) if disk content changed or a write failed; preserve a draft worth keeping before reloading disk state.

Production rejects the filesystem-save route. Complete preset JSON and source downloads remain separate actions. The official preset mechanism represents official Essentials; the complete Form & Field JSON preserves Advanced as well. The old `ff1.` code/schema is archived legacy data and is not silently interchangeable with the new complete document.

Manual CSS is not embedded into preset JSON. Keep it with the CSS/source export or source-controlled style files. Neither saving nor downloading updates another project's existing source.

## Custom CSS

Prefer semantic variables or stable `data-slot` attributes, and inspect the actual family implementation first:

```css
[data-slot="card-header"] {
  row-gap: 0.75rem;
}
```

Check both modes, portals, focus, selected/disabled/invalid states, and mobile sizes after changes. CSS can customize presentation; it cannot supply missing accessible behavior or backend integration.
