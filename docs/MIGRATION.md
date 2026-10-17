# Migration to the official website fork

Migration date: **4 October 2026**. The fork now occupies `/Users/rafael/Repos/ff`. The sidebar extension, workspace transition, targeted checks, production build, and representative consumer validation are complete. Coverage limits are recorded below; this is not a claim that every upstream example/style combination has been exercised.

## Git foundation

The foundation is the real GitHub fork [rafael-alani/ff](https://github.com/rafael-alani/ff), cloned from the official shadcn/ui project with full history. At the migration baseline it contains 2,476 commits. `origin` points to the user's fork and `upstream` to `https://github.com/shadcn-ui/ui.git`.

Exact upstream baseline: `295a1f114a138f23b5dfee0e0c6812394dfeb90c` (`feat(registry): add ten community registries (#12105)`). The machine-readable record is `form-field.upstream.json`. The official `apps/v4` build and initial browser preview were verified before adding Form & Field functionality.

## Recoverable legacy project

The previous project had no `.git` directory. Its source archive is retained as `.migration/legacy-source-2026-10-04.tar.gz`, SHA-256:

```text
a5b7b3499c250b5ce8ae2bb46b893b6e2de1117fda9bddf5df611f3580d0b1d2
```

The transition retains the full old project in `.migration/legacy/`, including its dependencies and build output. The archive hash above was verified before moving the fork from `.migration/fork/` into `/Users/rafael/Repos/ff`. All 2,476 baseline commits and both remotes survived the move. Dependencies were relinked with pnpm 10.33.4 using the frozen lockfile. Keep the archive and legacy directory until recovery is no longer needed. Inspect or extract the archive into a separate temporary directory; do not extract it over the working fork.

The read-only legacy audit verified 61 source-bearing Radix components across eight styles, 512 unchanged source/helper files, three local recipes, and 64 gallery entries. Legacy TypeScript checks passed and all 44 tests passed, including an independent React consumer check/build. Those counts describe only the old project. The original import fetched registry JSON and did not run a literal shadcn `add --all` operation.

## What is retained and migrated

The fork retains the actual upstream site, three component families, official configuration, all source styles, preview compositions, registry metadata, documentation/example source, templates, and supporting workspace packages. Component, composed-example and application-template categories remain distinct. The showcase now comes from the official website rather than locally invented substitutes.

Form & Field selectively ports the Advanced controls, safe color/numeric validation, browser draft concept, complete preset serialization, generated CSS, manual override separation, protected local save storage, and source archive functionality. Advanced is additive to the existing sidebar; its unset defaults preserve upstream appearance. The saved complete baseline selects the real `preview-02` composition rather than the upstream placeholder item. The old saved preset is retained in `packages/styles/legacy-preset.json` for reference.

The old standalone `src/App.tsx`, imported component snapshot, custom gallery, npm/Vite tooling, snapshot updater, and local copy installer are retired from the working architecture. Their source remains recoverable in the legacy archive. Old presets use a different schema and are not silently coerced into new documents.

## Intentional differences and ownership

Owned additions are concentrated in:

- `apps/v4/components/form-field/`: provider, Advanced panel, preview stylesheet, save/export actions.
- `apps/v4/lib/form-field/`: Advanced model/CSS, complete document, protected storage, source/ZIP export and tests.
- `apps/v4/app/api/form-field/`: save and export route handlers.
- `packages/styles/`: saved preset, generated theme, manual overrides, legacy preset reference.
- Root Form & Field command aliases, the tested Node 26.9.0 pin, documentation, and provenance record.

Integration edits to official create/sidebar/provider/preview files connect those modules. Form & Field identity changes are limited to the site/studio presentation. Supporting generator adjustments must retain every supported family, including Aria. Review actual `git diff` against the baseline when updating; this ownership list does not replace the diff.

Source exports apply official style/icon/menu/font/direction transforms and add a complete Next.js consumer scaffold. They include selected settings and dependencies; the collection option means all UI components of the selected family plus the selected example. It does not download every template in the monorepo. Website-only imports that cannot be made portable must fail visibly. External media remains network dependent and is recorded in the source manifest.

## Validation record

| Check                                                                                         | State                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy inventory, unchanged source status, typecheck and 44 tests                             | Passed during migration audit.                                                                                                                                                    |
| Official baseline website build and initial real preview                                      | Passed before Form & Field integration.                                                                                                                                           |
| Advanced neutral defaults, safe parsing, strict saves, color modes, CSS and ring preservation | 13 tests passed after integration.                                                                                                                                                |
| Form & Field complete save/export tests and targeted typecheck/build                          | `pnpm ff:check`, all 34 `pnpm ff:test` tests, and `pnpm ff:build` passed from the final project location.                                                                         |
| Desktop/mobile Essentials, Advanced, keyboard, themes and example interactions                | Verified at 1440×1000, 390×844 and 390×640; see coverage below.                                                                                                                   |
| Independent source consumer                                                                   | Fresh Radix/Nova and React Aria/Nova `preview-02` ZIPs: dependency installation, typecheck and Next production build passed. Earlier Base UI independent consumer build retained. |
| Hosting, npm publication and externally hosted registry CLI                                   | Not performed or claimed.                                                                                                                                                         |

The commands changed from the old Vite project's npm scripts to pinned pnpm workspace commands: `pnpm ff:check`, `pnpm ff:test`, `pnpm ff:build`, and `pnpm ff:registry`. The final build regenerated all three families across eight source styles and built the official website. Broader inherited root checks remain separate and were not rerun in this continuation. The upstream Next build skips TypeScript validation; the separate successful `ff:check` is therefore required evidence.

### Browser and export coverage

- Advanced updates the preview document without resizing the studio controls. Root font size was verified as 18px in the iframe while the shell stayed 16px. React Aria button minimum height reached 64px and reset correctly. Advanced values survived family and Essentials changes.
- Keyboard arrows and Enter switch the sidebar tabs; keyboard arrows adjust sliders. Invalid colors show an associated error. Valid hex colors apply on Enter. Individual resets and Reset all restore the selected upstream style without changing Essentials.
- Essentials Nova/Vega switching, Base UI/Radix/React Aria previews, light/dark theme synchronization, and the payout currency selector were exercised. The Contribution History, Payout Threshold, Preferences, and Savings Targets come from the official composition.
- Advanced now has one panel scroller. The mobile sidebar is capped at 70dvh, with bounded save/download content, so expanding actions keeps the preview visible. No page-level horizontal overflow was observed at the tested mobile widths.
- The download button successfully returned an HTTP 200 source archive. A fresh API export was extracted into `/tmp/ff-final-consumer-radix`, installed independently (no workspace dependency symlinks), typechecked, and production-built. Its CSS retained the test's 18px root size, 44px button minimum height, and `#6633cc` primary color, alongside the preset, dependency manifest, source provenance, and official nested card source.
- A separate fresh React Aria/Nova export was extracted into `/tmp/ff-final-consumer-aria`, installed independently, typechecked, and production-built. Its build retained the upstream accessible-label warning noted below. Both fresh archives contained 85 files.
- The built server returned HTTP 200 for `/create` and HTTP 404 for `/api/form-field/styles`, confirming filesystem saves are disabled in production. Save revisions, backups, preservation of overrides, and failed-write rollback are covered by the passing storage suite.

Local logs and desktop/mobile screenshots are retained under `.studio/validation/` (gitignored).

### Remaining limits

Some upstream React Aria examples emit missing-accessible-label warnings. The extension preserves their source; this work does not claim a complete accessibility audit. Not every combination of family, style, icon set, example, RTL mode, or exported application template has been independently built or manually exercised. External example media may still require network access. Source downloads require the source-capable server; no static-hosting or externally hosted CLI support is claimed.

The GitHub API confirmed `rafael-alani/ff` is a fork of `shadcn-ui/ui`. Form & Field additions remain local, uncommitted changes; this continuation did not push or deploy them.

Future upstream updates follow [UPSTREAM.md](UPSTREAM.md). Existing consumer projects remain independently owned snapshots; this migration does not replace their files.

## Advanced v2 revision — 4 October 2026

This revision supersedes the earlier Advanced control inventory and root-size/minimum-height checks above. The sidebar now has Colors, Typography, Sizing and spacing, and Surfaces and shape. Root-size, global spacing, icon and motion overrides are retired. Existing v1 colors migrate with a visible notice; retired numeric settings reset, and browser migration backs up the old draft. See [TOKENS.md](TOKENS.md) for exact target and migration contracts.

The only additional upstream primitive change is two metadata attributes (`data-size`, `data-variant`) on `registry/bases/base/ui/button.tsx`. Base UI's native props and behavior are retained. The standard registry build regenerated all 24 Base UI/Radix/React Aria × style combinations. Advanced CSS, saved documents and source downloads use the same v2 schema/generator; manual overrides remain unchanged.

Validation for this revision:

- `pnpm ff:check` and all **37** `pnpm ff:test` tests passed with pnpm 10.33.4. `pnpm ff:build` passed, including all-family registry generation. The build still reports inherited Sera `@utility` parsing and broad dynamic-file-pattern warnings. The broader upstream monorepo suites were not run.
- Real studio previews were exercised at 1440×1000, 390×844 and 390×640. Mobile retained preview space with Save & download open and had no page-level horizontal overflow. Both color modes, tab/number keyboard controls, invalid input, individual/density/all resets, source-download action, and a real payout-currency dropdown were checked. React Aria's inherited missing-label warnings remain.
- Nova and Vega inheritance was verified: default control height changed from 32px to 36px and card padding from 16px to 24px. Compact produced 28px default/24px small controls and square icon buttons. Standard sizing was checked in Base UI and Radix as well as React Aria. Role typography produced 18px descriptions, 22px titles and unchanged 14px button text; root size stayed 16px and Tailwind spacing stayed 0.25rem. Reset all left the Advanced preview stylesheet empty.
- A fresh **Base UI/Nova `preview-02`** source archive was downloaded through the local API, extracted into `/tmp/ff-advanced-v2-consumer`, installed independently, typechecked and production-built. Its browser preview reproduced 40px default/36px small controls, 18px descriptions/22px titles, 8px control corners and 12px floating corners, plus separate elevation with retained ring borders. The sandbox initially blocked Turbopack's internal port; a fresh cache and approved build access resolved it.
- The new consumer build covers Base UI/Nova. Radix and React Aria were exercised in the studio but were not independently rebuilt as consumers in this revision. The earlier migration consumer checks above are historical evidence. Other styles, every role/state combination, RTL and all component collections were not exhaustively tested. No deployment or publication was performed.

Local logs and screenshots are under `.studio/validation/advanced-*`. The original primary-color draft and Essentials selection were restored after browser testing; test edits were not saved to checkout styles.
