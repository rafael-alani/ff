# Form & Field: architecture and guide for coding agents

This checkout is a Git fork of shadcn/ui. Work from the official `apps/v4` architecture. Do not revive the archived standalone Vite studio, recreate official controls in a parallel application, or replace the fork with downloaded component snapshots.

Read [AGENTS.md](../AGENTS.md), [the studio guide](../FORM_FIELD.md), [design principles](DESIGN_PRINCIPLES.md), and [component APIs](COMPONENT_API.md) first. Read the generated [app instructions](../apps/v4/AGENTS.md) and the relevant installed Next documentation before editing that app. Consult [TOKENS.md](TOKENS.md) for appearance changes and [UPSTREAM.md](UPSTREAM.md) for upstream integration. Setup and test procedures live in [Development](DEVELOPMENT.md).

## Ownership

| Area                                            | Owner and contract                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `apps/v4/app/(app)/(create)/`                   | Official create flow, Essentials, URL state, preview selection and synchronization. Keep integration changes small. |
| `apps/v4/registry/config.ts`, registry metadata | Official configuration validation, styles, families, themes, fonts and transforms.                                  |
| `apps/v4/registry/bases/{base,radix,aria}/`     | Actual primitive and composed registry source. Follow each family's API.                                            |
| `apps/v4/examples/`                             | Official documentation/demo examples; retain upstream provenance.                                                   |
| `apps/v4/registry/styles/`                      | Authored upstream style recipes used by the generator.                                                              |
| `apps/v4/components/form-field/`                | Advanced UI, draft provider, preview integration, save and export actions.                                          |
| `apps/v4/lib/form-field/`                       | Advanced validation/CSS, complete document, storage, export and tests.                                              |
| `apps/v4/app/api/form-field/`                   | Node route handlers for local saves and source downloads.                                                           |
| `packages/styles/src/`                          | Saved complete preset, generated theme, and separate manual overrides.                                              |

Generated style files, registry indexes and public registry JSON are outputs. Regenerate them from authored sources with `pnpm ff:registry`. Keep all supported families, including React Aria, in the generation and review scope.

The retained workspace also includes the [CLI](../packages/shadcn/README.md),
[registry/install library](../packages/registry/README.md),
[React helpers](../packages/react/README.md),
[AI helpers](../packages/helpers/README.md), and
[integration harness](../packages/tests/README.md). Their package boundaries and
release workflows remain upstream-owned. `packages/styles/` contains shared CSS
and preset files; it has no package manifest or independent release.

## State and runtime boundaries

The `/create` layout wraps the upstream customizer in
[`FormFieldProvider`](../apps/v4/components/form-field/provider.tsx). It combines
the official URL-backed Essentials state with Advanced state. Startup reads the
saved preset bundled from `packages/styles/src/preset.json`, then attempts to
restore the origin's browser draft. An existing URL query keeps authority over
Essentials. Browser effects write local storage; opening a preview is not a
read-only operation on browser state.

The [preview integration](../apps/v4/components/form-field/preview-styles.tsx)
applies Advanced CSS and manual overrides inside the preview document. Its
iframe handshake checks both origin and sender. Representative inherited
metrics return to the sidebar, while Essentials remains in the upstream
provider. The studio shell is not the target for preview customization.

[`document.ts`](../apps/v4/lib/form-field/document.ts) validates the complete
document and generates theme CSS for both disk saves and downloads. The
[styles route](../apps/v4/app/api/form-field/styles/route.ts) is a local,
development-only Node route; it reads a revision on GET and validates/writes on
POST. [Operations](OPERATIONS.md) owns conflict handling and rollback limits.
The [export route](../apps/v4/app/api/form-field/export/route.ts) also uses Node
but remains available in production. It reads authored source, applies official
transforms, follows local dependencies, and assembles a ZIP in memory. It does
not save the draft or update an existing consumer project.

The Form & Field paths have no application account or database layer. Public
downloads are separate from the guarded local filesystem capability. Inherited
site services, external links/media, and package installation have their own
network dependencies; retaining them does not make the full website an offline
application. A standalone consumer owns its copied source and any real product
integrations. The fork/legacy decision and its provenance are recorded in
[MIGRATION.md](MIGRATION.md).

## Changes and validation

Official Essentials state is owned upstream. Advanced is a separate optional layer; do not duplicate upstream metadata or force guessed numeric defaults into the preview. Keep its empty preset visually neutral. Apply Advanced CSS inside the preview document so it does not resize the studio's own controls.

Use actual source exports and types. A composed example is not interchangeable with the primitive beneath it. A collection of components is not an application template. Demo interactions remain local; do not imply financial transactions, delivery, authentication or other services.

Before completion run `pnpm ff:check`, `pnpm ff:test`, and `pnpm ff:build`, plus relevant upstream package tests. For UI work inspect actual mobile/desktop previews, keyboard access, open overlays, both color modes, and affected controls. Export changes need an independent consumer check and build. Report incomplete checks and inherited failures precisely.

The broader root `pnpm check`, `pnpm test`, and `pnpm build` are upstream monorepo tasks. A passing Form & Field suite is not evidence that those broader tasks ran. Migration validation is recorded in `docs/MIGRATION.md`.

Consumers own copied source. Updating the fork, saving styles, or exporting another archive does not update existing projects. Review differences and preserve local edits. Do not claim hosting, package publication, or remote registry support without testing it.
