# Operating the local studio

Use [development setup](DEVELOPMENT.md#set-up-this-checkout) to start the studio
and [the studio guide](../FORM_FIELD.md) for save/import actions. This guide
covers the checkout's saved styles and local production inspection. The private staging deployment is described below; no disaster-recovery
procedure has been verified. See [the dated validation record](MIGRATION.md).

## State to preserve

Browser drafts belong to the browser origin. Download a complete preset before
clearing browser data, switching origin/profile, or replacing a draft. Preset
JSON excludes manual CSS. The [style file contract](TOKENS.md#file-contract)
identifies the checkout files to preserve together: preset, generated theme,
manual overrides, and the shared CSS entry.

Each local save copies the **previous** `preset.json` and `theme.css` into one
timestamped directory under `.studio/backups/`. These backups exclude manual
overrides and other source. `.studio/` is gitignored and remains on the same
machine, so it is not an off-machine backup. Keep deliberate style changes in
reviewed source control and preserve local-only backups separately when moving
the checkout. Legacy-project recovery has its own
[migration record](MIGRATION.md#recoverable-legacy-project).

## Save diagnostics

Use the loopback development server, preferably
`http://127.0.0.1:4000/create`. Save is a local development capability, without an
account login. The request guard checks development mode, local host and
forwarding headers, and matching origin; it is not a public authentication
service. Keep the development server on loopback.

| Result                               | Meaning and recovery                                                                                                                                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Save button is disabled              | Wait for the initial revision read. Inspect the status message if it fails; confirm the server is local development and both saved files exist.                                                |
| `404`, local development only        | Production deliberately disables both reads and writes at `/api/form-field/styles`. Use downloads there.                                                                                       |
| `403`, same local origin required    | Use a direct loopback URL with matching origin, not a remote host/proxy. Do not bypass the guard.                                                                                              |
| `409`, styles changed                | Download the current browser draft first. Inspect disk edits, then use **Reload saved styles**, which replaces the draft and obtains the new revision. Reapply intended changes before saving. |
| `409`, another operation in progress | Wait for that operation to finish, then retry.                                                                                                                                                 |
| `409`, symbolic link                 | Storage refuses symlinks in save/backup paths. Inspect the path and restore an ordinary checkout layout without discarding its contents.                                                       |
| `400`, `413`, or `415`               | The save body must be valid preset JSON, at most 64,000 bytes including its envelope, sent as `application/json`. Use the studio controls; review schema errors before importing.              |
| `500`, previous files restored       | A write failed and automatic rollback reported success. Inspect the pair and filesystem permissions/free space before retrying.                                                                |
| `500`, rollback could not complete   | Preserve current files and restore both files from the backup directory named in the error, following the procedure below.                                                                     |

The styles GET reads files without saving them. POST validates the complete
document and revision before writing. A process-local guard rejects overlapping
operations; each file is replaced via a temporary file and rename. The pair is
written sequentially, with rollback on caught failures. This is not a guarantee
against process termination between writes or multiple server processes.

## Restore a saved style pair

1. Download any browser draft worth keeping. Stop the local studio with Ctrl-C
   and pause editor writes to the saved style files.
2. Copy the current `packages/styles/src/` files into a separate recovery
   directory. Keep them even if one file appears damaged.
3. Inspect `.studio/backups/` and select a directory containing **both**
   `preset.json` and `theme.css`. The timestamp is the attempted save time; its
   files represent the state before that save. For a reported rollback failure,
   start with the exact directory named by the error.
4. Copy that matched pair into `packages/styles/src/`, replacing only those two
   files. Preserve `overrides.css` and `styles.css`; the save backup cannot
   recover edits to either of those.
5. Restart with `pnpm ff:dev`. After preserving the browser draft, choose
   **Reload saved styles**. Expect **Saved styles loaded.** and inspect Essentials,
   Advanced, and both color modes. Review the file diff before saving again.

Do not mix a preset from one backup with a theme from another. If validation
fails, retain the failed pair and try an earlier complete backup compatible
with the current schema. The [storage tests](../apps/v4/lib/form-field/storage.test.ts)
exercise failed-write rollback on temporary fixtures. This manual restore
procedure is derived from the file contract; it has not been rehearsed against
the user's saved styles. It does not restore consumer projects.

## Export diagnostics

Save the complete preset and record the selected item, family, style, scope,
and error shown under **Save & download**. A missing source dependency or an
unsupported website-only import should fail visibly. Confirm dependencies are
installed and the registry has been regenerated; if the selected source still
fails, fix that portability path before calling the archive usable. Do not
silently remove required files.

The export route reads authored source, package metadata, local assets, manual
CSS, license, and provenance from the server's checkout. It assembles the ZIP
in memory and does not save the browser draft. A copied `.next` directory alone
is not evidence of a working export server. External example media remains a
network dependency identified in `SOURCE-MANIFEST.json`. After downloading,
follow [consumer validation](REACT.md); repository tests do not install every
archive's dependencies.

## Inspect a production build locally

With tools/dependencies installed and port 4000 available, run from the root:

```sh
pnpm ff:check
pnpm ff:test
pnpm ff:build
pnpm --filter=v4 exec next start --hostname 127.0.0.1 --port 4000
```

Open `/create` on that loopback origin. Confirm previews and downloads work and
that **Save to styles** / **Reload saved styles** are absent. A request to
`/api/form-field/styles` should return 404. Use disposable browser state if the
same origin already holds a draft. Stop the server with Ctrl-C.

The save and export routes require the Node runtime. Production disables disk
saves, but downloads still need source files and dependencies. Review
[`outputFileTracingIncludes`](../apps/v4/next.config.mjs) when packaging a server;
the declared tracing patterns alone do not verify a deployment. Static hosting,
external registry CLI compatibility, and npm publication remain outside the
tested operating paths. Upstream updates follow [UPSTREAM.md](UPSTREAM.md).

## Private staging

The homelab deploys this repository's `staging` branch at
[ff.staging.rafael.media](https://ff.staging.rafael.media/create), accessible
from LAN/Tailscale. Push a reviewed commit to that branch; CT114 polls every
two minutes, builds `Dockerfile.staging`, and accepts only healthy releases.
The image builds with Node 26.9.0, pnpm 10.33.4 and Bun 1.3.14, runs the
Form & Field build, typecheck and tests, and retains source needed by downloads.
`NEXT_PUBLIC_APP_URL` is supplied during the build. No external API keys are
required or supplied. Inherited integration features remain unconfigured.

This is the production server: local filesystem saves are disabled. Drafts
remain in the browser, so export a preset before changing origin or clearing
browser storage. The container has no persistent application volume; release
source bundles/configuration are retained by dothomelab. Existing images and
release definitions remain available for rollback; browser drafts are outside
server backups. Runtime routing, resource limits and enrollment live in
`rafael-alani/dothomelab` under `hosts/staging/ff`.
