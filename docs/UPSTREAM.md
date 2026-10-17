# Updating the upstream fork

Form & Field tracks a real fork with complete Git history:

- `origin`: `https://github.com/rafael-alani/ff.git`
- `upstream`: `https://github.com/shadcn-ui/ui.git`
- Original migration baseline: `295a1f114a138f23b5dfee0e0c6812394dfeb90c`

`form-field.upstream.json` records the immutable migration baseline and the latest deliberately accepted upstream commit. A fork does not synchronize automatically. All parity statements must name the accepted commit; current online registry contents may differ.

## Review on an integration branch

Start with a clean, committed working tree. Do not stash, discard, or overwrite unrelated edits automatically. Replace the example branch date with the update's date.

```sh
git status --short
git remote -v
git fetch origin
git fetch upstream
git switch main
git pull --ff-only origin main
git switch -c upstream/update-YYYY-MM-DD
ff_baseline=$(node -p "JSON.parse(require('fs').readFileSync('form-field.upstream.json','utf8')).acceptedUpstreamCommit")
git log --oneline "$ff_baseline"..upstream/main
git diff --stat "$ff_baseline"..upstream/main
git diff "$ff_baseline"..upstream/main -- apps/v4/registry apps/v4/examples 'apps/v4/app/(app)/(create)' packages pnpm-lock.yaml
git merge --no-ff --no-commit upstream/main
```

Review configuration/schema, family/style inventories, component APIs and slots, composed examples, accessibility behavior, dependencies, generated-output paths, and the Next instructions. Inspect changes to the exact integration files listed in `docs/MIGRATION.md`. The independent Advanced default must remain empty CSS.

When conflicts occur, compare both sides and the common ancestor. Retain upstream behavior and reapply the small Form & Field integration where appropriate. Keep owned modules and manual CSS rather than blindly selecting one side for the whole tree. Use `git diff --name-only --diff-filter=U` to find unresolved files. `git merge --abort` returns to the pre-merge branch state if the integration must be abandoned before committing.

## Regenerate from authored source

Use pinned pnpm 10.33.4, the tested Node 26.9.0 runtime, and Bun. Review lockfile changes, then install without silently rewriting an accepted lockfile:

```sh
pnpm install --frozen-lockfile
pnpm ff:registry
```

If dependency manifests intentionally require a new lockfile, regenerate it deliberately with the pinned package manager and review that diff. Build from `registry/bases`, `examples`, and authored `registry/styles/style-*.css`; do not resolve conflicts only in generated `styles/`, registry indexes or public JSON.

The generator must cover **Base UI, Radix, and React Aria**, across every style in `STYLES`. React Aria must not disappear because older comments or manual loop lists mention only Base/Radix. Check generated family/style directories, dynamic imports, registry entries, preview coverage and source export dependencies together. Rebuild supporting workspace packages when their code or transforms change.

## Validate and accept the revision

```sh
pnpm ff:check
pnpm ff:test
pnpm ff:build
```

Also run the relevant upstream package suites, and the broader root `pnpm check`, `pnpm test`, or `pnpm build` when the update's scope requires the entire workspace. Record exactly which commands ran and any inherited failures; do not substitute one claim for another.

Inspect real desktop/mobile previews for all changed families/styles. Exercise Essentials, Advanced, shuffle/locks, light/dark, keyboard navigation, portal overlays, composed examples, local save conflict handling and downloads. Export selected examples and component collections; install, type-check and build representative independent consumers for each changed family and transform path. Confirm manual overrides and source provenance survive.

After validation, set `acceptedUpstreamCommit` in `form-field.upstream.json` to the exact merged `upstream/main` SHA. Keep `migrationBaseline.commit` unchanged. Update intentional differences and validation evidence in `docs/MIGRATION.md`, review the final diff, commit the merge/integration, and push the branch for review. Merge that reviewed branch into the fork's main branch through the normal review process.

The retired snapshot updater under the legacy archive must not run against this fork. Git conflict review now protects local customizations. Consumer projects still own their copies and require their own reviewed updates.
