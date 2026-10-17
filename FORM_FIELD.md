# Form & Field

Form & Field extends the official shadcn/ui website with an Advanced customization tab, complete presets, protected local saves, and source downloads. The official customization controls, component families, styles, and composed previews remain the foundation.

- Fork: [rafael-alani/ff](https://github.com/rafael-alani/ff)
- Upstream: [shadcn-ui/ui](https://github.com/shadcn-ui/ui)
- Migration baseline: [`295a1f114a138f23b5dfee0e0c6812394dfeb90c`](https://github.com/shadcn-ui/ui/commit/295a1f114a138f23b5dfee0e0c6812394dfeb90c), recorded on 4 October 2026.

The repository retains upstream history and supporting workspace packages. This file documents studio workflows; use the [documentation map](docs/README.md) for development, source ownership, and recovery. The [migration record](docs/MIGRATION.md) records historical verification and release limits. The local extension must be committed and made available before a clone of the fork can reproduce it.

## Run locally

Complete [development setup](docs/DEVELOPMENT.md#set-up-this-checkout), including dependencies and the first registry build, then run:

```sh
pnpm ff:dev
```

Open [the local studio](http://127.0.0.1:4000/create). Its Form & Field actions require no account. The developer/operator runs the checkout and owns saved styles; a studio user edits a browser draft; a consuming project's developer owns the downloaded source and integrations. These are workflow responsibilities, not application account roles.

## Customize a preview

1. Open `/create` and dismiss the welcome dialog if shown. Use **Essentials** to choose the component family, style, palette, fonts, and other official options. Choose a preview through **Menu → Navigate...** (or Cmd/Ctrl+P), search for an item, and select it. Families retain their own APIs and example inventories.
2. Switch to **Advanced**. Expand Colors, Typography, Sizing and spacing, or Surfaces and shape, then change a value. Unset values inherit the selected upstream style. Color edits commit on blur or Enter after validation; correct any displayed error before continuing.
3. Inspect the actual preview in light and dark modes using **Menu → Light/Dark**, including menus/dialogs and narrow layouts. Light and dark color overrides are separate. See [the setting contracts](docs/TOKENS.md#neutral-advanced-values) for typography targets, density, and contrast-feedback limits.
4. Use a control's reset or **Reset all** in Advanced to return to inherited appearance. This leaves Essentials intact. Example actions use local demo state; they do not connect your product to financial, authentication, or other services.

Changes are browser drafts until explicitly saved. A draft belongs to that browser profile and origin: `localhost` and `127.0.0.1` do not share it. On startup, a URL with query parameters keeps its Essentials settings; Advanced is restored from the browser draft or saved defaults. Download a complete preset to transfer both layers. An official preset/link alone does not carry the complete Advanced document.

## Preserve or reopen a preset

Open **Save & download** beneath the customization controls.

- **Download complete preset** saves `form-field-preset.json`, containing Essentials and Advanced. Keep manual CSS separately; it is not part of preset JSON.
- To reopen it, expand **Open complete preset**, paste the JSON, and choose **Open preset draft**. Expect **Preset opened as a browser draft.** Invalid documents show a status error. A v1 Advanced import retains colors but resets retired global numeric controls with a notice; retain the original if you need to reproduce that earlier appearance.
- In local development, **Save to styles** writes the preset and generated theme into this checkout, preserving manual overrides. Wait for **Saved to styles.** Review the saved-file diff before committing. **Reload saved styles** replaces the browser draft with the disk preset; download a draft worth keeping before using it. If a save reports changed files, follow [conflict recovery](docs/OPERATIONS.md#save-diagnostics).

Production offers downloads/import as browser drafts but disables disk saves. Neither action updates source already copied into another project. File ownership and schema details live in [TOKENS.md](docs/TOKENS.md).

## Download and use source

With the desired preview selected, choose an action in **Save & download**:

| Action                            | Result                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Download this example**         | Selected registry item and its transitive local source dependencies.                                  |
| **All components + this example** | All maintained UI components for the selected family, plus the selected example and its dependencies. |

Both ZIPs include a Next.js consumer scaffold, selected settings, generated theme, manual overrides, required packages/local assets, and provenance. They do not contain every application template in this monorepo. If preparation fails, inspect the error shown under the download actions and follow [export diagnostics](docs/OPERATIONS.md#export-diagnostics).

Extract into a new directory and follow [React consumption](docs/REACT.md) to install, type-check, build, and integrate the source. Review `SOURCE-MANIFEST.json` for provenance and external media dependencies. Downloads require the source-capable Node server; static hosting is not a verified deployment path.

For durable handwritten CSS, follow [custom CSS](docs/TOKENS.md#custom-css). For command details use [Development](docs/DEVELOPMENT.md); for upstream changes use [Upstream maintenance](docs/UPSTREAM.md).
