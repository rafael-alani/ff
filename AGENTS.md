# Form & Field repository context

Form & Field is a maintained fork of the official shadcn/ui workspace. The studio is the Next.js website in `apps/v4`, extended with an Advanced tab in its existing customization sidebar. It is a source-owned React library and studio, not a published Form & Field npm package. Keep upstream Git history and the `origin`/`upstream` remotes. Start with the [documentation map](docs/README.md); use [FORM_FIELD.md](FORM_FIELD.md) for workflows, [Development](docs/DEVELOPMENT.md) for setup/checks, [Operations](docs/OPERATIONS.md) for save recovery, and [MIGRATION.md](docs/MIGRATION.md) for provenance and dated evidence.

Read [the AI guide](docs/AI_GUIDE.md), [component APIs](docs/COMPONENT_API.md), and [design principles](docs/DESIGN_PRINCIPLES.md) before changing or consuming components. Consumer setup lives in [REACT.md](docs/REACT.md), styling in [TOKENS.md](docs/TOKENS.md), and upstream maintenance in [UPSTREAM.md](docs/UPSTREAM.md). Follow `apps/v4/AGENTS.md` and the installed Next documentation before changes within that application.

- Authored upstream source lives in `apps/v4/registry/bases/`, `apps/v4/examples/`, `apps/v4/registry/styles/`, and the official registry/config modules. Preserve the actual Base UI, Radix, and React Aria implementations, native APIs, composed examples, and framework infrastructure. Do not rebuild the official studio independently or substitute the retired imported snapshot.
- Concentrate Form & Field additions in `apps/v4/components/form-field/`, `apps/v4/lib/form-field/`, `apps/v4/app/api/form-field/`, and `packages/styles/`. Keep changes to upstream integration files small and documented.
- Official Essentials remain authoritative. Advanced is an additional tab; neutral Advanced values must emit no CSS. Centralize customization in the shared CSS generation and manual `packages/styles/src/overrides.css`, rather than editing every primitive. The exported CSS must remain usable independently of React.
- Generated `apps/v4/styles/`, registry indexes, and `apps/v4/public/r/` are outputs. Change authored source first, then run `pnpm ff:registry`. Regenerate all supported family/style combinations, including React Aria; do not repair only a generated file.
- Reuse semantic tokens and upstream `cn()` conventions. Preserve labels, native semantics, keyboard access, visible focus, portal themes, responsive layout, and reduced-motion handling. Sample actions remain local demonstrations unless a separate product integration is deliberately implemented.
- Browser settings are drafts. Dev-only Save to styles validates the complete preset, protects revisions, backs up the previous pair, and writes `preset.json` plus generated `theme.css`. Preserve manual overrides. Production can download presets and source; production cannot write local style files through the save endpoint.
- Downloads must include the selected official source and its transitive local dependencies, selected settings, required packages/assets, and provenance. Keep components, composed examples, and application templates distinct. Report any unsupported integration or external media dependency.
- Consumers own their copied source. Never imply that a fork update or studio save updates another project. Inspect differences before replacing consumer files; retain local edits.
- The old `scripts/upstream.mjs` snapshot updater and `scripts/add.mjs` installer belong to the archived legacy project. Maintain this fork with Git as described in `docs/UPSTREAM.md`.

Use the pinned `pnpm@10.33.4` workspace toolchain. Before finishing a code change, run `pnpm ff:check`, `pnpm ff:test`, and `pnpm ff:build`; run upstream package tests when changing those packages. These replace the former Vite project's `npm run check`, `npm test`, and `npm run build`. The upstream root `pnpm check`, `pnpm test`, and `pnpm build` remain broader monorepo tasks. Do not report a narrower suite as the complete upstream suite.

UI changes also require real desktop/mobile previews and affected controls: Essentials, Advanced, light/dark, keyboard interaction, examples, and downloads. Validate exported code in an independent consumer for export changes. State inherited failures, untested combinations, and integration limits plainly. Do not claim deployment, registry hosting, npm publication, or remote CLI compatibility without performing that work.

Update affected documentation in the same change as behavior, configuration,
commands, or boundaries: [studio workflows](FORM_FIELD.md), [source ownership
and state flow](docs/AI_GUIDE.md), [component APIs](docs/COMPONENT_API.md),
[consumer integration](docs/REACT.md), [styles](docs/TOKENS.md), and
[operations](docs/OPERATIONS.md). Update [Development](docs/DEVELOPMENT.md) when
setup, commands, testing procedures, or meaningful verification coverage changes.
Search for old values and affected summaries, including the
[documentation map](docs/README.md). Preserve historical dates in
[MIGRATION.md](docs/MIGRATION.md); add evidence there for meaningful new coverage
or resolved gaps, and keep routine check results in the task response or PR.
Internal refactors with no documented effect need no doc edit. Routine upkeep
is part of completing implementation, without a separate documentation pass.
