# Developing Form & Field

Run commands from the repository root unless stated otherwise. Read
[AGENTS.md](../AGENTS.md) and the [source ownership map](AI_GUIDE.md) before
editing. For application code, also read [the Next.js instructions](../apps/v4/AGENTS.md)
and the relevant installed documentation under
`apps/v4/node_modules/next/dist/docs/`.

## Set up this checkout

Use **Node 26.9.0** from [`.nvmrc`](../.nvmrc), **pnpm 10.33.4** from
[`package.json`](../package.json), and Bun for registry generation. Bun is
required by the build script but is not version-pinned here. Git is needed for
the fork workflow. Dependency installation needs network access; the website
uses `next/font/google`, so a build can also need font downloads.

If using nvm, run `nvm install` followed by `nvm use` in this directory. Otherwise
select the Node version with your runtime manager. Check the tools before
installing:

```sh
node --version
pnpm --version
bun --version
pnpm install --frozen-lockfile
pnpm ff:registry
pnpm ff:dev
```

Expect Node `v26.9.0` and pnpm `10.33.4`. If your pnpm differs, substitute
`npx --yes pnpm@10.33.4` for `pnpm` in these commands; fetching it needs network
access. In particular, pnpm 11 ignores the root manifest's `pnpm.overrides` and
`pnpm.packageExtensions`. Do not change the lockfile to accommodate that tool
mismatch.

Open [the local studio](http://127.0.0.1:4000/create). `ff:dev` binds to loopback;
it does not run the upstream icon watcher. Stop it with Ctrl-C in its terminal.
The [studio guide](../FORM_FIELD.md) describes the controls and expected results.

The Form & Field preview, preset, save, and export paths do not require an
account or external API key. The public URL defaults are in
[`apps/v4/.env.example`](../apps/v4/.env.example); `NEXT_PUBLIC_APP_URL` controls
site URLs. Other inherited site features have their own integrations. Registry
health monitoring is separate and can publish remote state: follow its
[runbook](../apps/v4/registry/README.md#public-registry-health-monitoring) only
when working on that feature.

## Commands and their effects

The root and [app manifests](../apps/v4/package.json) define the actual commands.

| Command            | Scope and effects                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm ff:dev`      | Next development server on `127.0.0.1:4000`; writes development caches and may regenerate Next agent guidance.                                   |
| `pnpm ff:registry` | Builds supporting workspace packages, then runs the Bun registry generator; writes generated styles, indexes, public registry files, and caches. |
| `pnpm ff:check`    | Runs `v4`'s `tsc --noEmit`; this is TypeScript checking, not lint or formatting. Incremental compiler metadata may be written.                   |
| `pnpm ff:test`     | Runs Vitest filtered to `apps/v4/lib/form-field`; covers Advanced, document/CSS, request guards, storage, and source export.                     |
| `pnpm ff:build`    | Runs the app build, including registry generation, then `next build`; writes build output and may fetch fonts.                                   |

The Next configuration sets `typescript.ignoreBuildErrors: true`; a successful
build does **not** replace `ff:check`. The `ff:test` filter does not run all create
flow, registry, CLI, or browser suites. Its storage tests use temporary
directories; export tests read checkout source and create archives in memory.
See [verification history](MIGRATION.md) for the separately tested browser and
consumer journeys.

## Regenerate and debug

Change authored source in `apps/v4/registry/bases/`, `apps/v4/examples/`, and
`apps/v4/registry/styles/`. Use `pnpm ff:registry` for the full build across Base
UI, Radix, React Aria, and every supported style. Generated `apps/v4/styles/` and
public registry output are not replacements for authored files.

The [registry runbook](../apps/v4/registry/README.md#fast-targeted-builds) describes
faster iteration flags. Its older two-family descriptions are incomplete for
this fork: [`BASES`](../apps/v4/registry/bases.ts),
[`STYLES`](../apps/v4/registry/styles.tsx), and
[`build-registry.mts`](../apps/v4/scripts/build-registry.mts) determine the actual
combinations. Rebuild all combinations before completing a generator or
primitive change. The upstream root `pnpm registry:build` also invokes lint
fixes and formatting across the workspace; `ff:registry` is the narrower alias.

| Symptom                                                           | Next step                                                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Missing/stale generated styles or unresolved `@/styles/…` imports | Run `pnpm ff:registry` after installing dependencies, then restart development.                                             |
| Changed icon metadata is absent                                   | Run `pnpm --filter=v4 icons:build`; `ff:dev` does not start `icons:dev`.                                                    |
| A build passes but editor/type errors remain                      | Run `pnpm ff:check` and inspect the first error; Next suppresses build-time type failures.                                  |
| Font download fails                                               | Check network access for the selected Google fonts; do not treat a partial build as passing.                                |
| Save is disabled, conflicts, or returns an error                  | Follow [save diagnostics](OPERATIONS.md#save-diagnostics).                                                                  |
| A source download fails or differs from the preview               | Capture the item, family/style, preset, and displayed error; follow [export diagnostics](OPERATIONS.md#export-diagnostics). |

## Validate a change

For code changes, run:

```sh
pnpm ff:check
pnpm ff:test
pnpm ff:build
```

Run affected upstream package tests as well, using their package scripts. The
broader root `pnpm check`, `pnpm test`, and `pnpm build` span the upstream
workspace; root `test` regenerates the registry and starts a website server.
Report those only if they actually ran. Inherited CI workflows are separate
from the Form & Field command aliases.

For UI changes, use a disposable browser profile or download the existing draft
before testing. Exercise desktop/mobile layouts, Essentials and Advanced,
light/dark modes, keyboard interaction, portals, resets, examples, and downloads.
For export changes, extract into a new directory and follow
[the independent consumer workflow](REACT.md#start-from-a-download), including
typecheck and build. Test each changed family/transform path; one passing
Base UI export does not establish Radix or React Aria coverage. Test disk writes
against disposable style files or a separate checkout.

For Markdown-only work, check local links, anchors, paths, command definitions,
and formatting on the edited files. For example:

```sh
pnpm exec prettier --check README.md FORM_FIELD.md AGENTS.md CONTRIBUTING.md 'docs/*.md'
git diff --check
git status --short
```

Review generated changes before committing; preserve unrelated work. Keep
routine check results in the task response or PR. The
[migration record](MIGRATION.md) owns dated evidence and meaningful coverage
limits, while [Contributing](../CONTRIBUTING.md) owns review conventions.
