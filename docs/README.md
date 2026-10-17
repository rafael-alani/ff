# Form & Field documentation

Start with [the studio guide](../FORM_FIELD.md) to customize, save, and download
source. These guides describe the Form & Field extension in this checkout and
its boundaries with the retained shadcn/ui workspace.

| Task                                                                  | Read                                                                             |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Use the studio, import a preset, or choose a download                 | [FORM_FIELD.md](../FORM_FIELD.md)                                                |
| Install tools, run locally, debug, or choose checks                   | [Development](DEVELOPMENT.md)                                                    |
| Find source ownership and understand state flow                       | [Architecture and agent guide](AI_GUIDE.md)                                      |
| Change or consume component APIs                                      | [Component APIs](COMPONENT_API.md) and [design principles](DESIGN_PRINCIPLES.md) |
| Integrate downloaded source into a React project                      | [React consumption](REACT.md)                                                    |
| Understand Advanced settings, presets, or manual CSS                  | [Tokens and styles](TOKENS.md)                                                   |
| Resolve save conflicts, restore styles, or inspect a production build | [Operations](OPERATIONS.md)                                                      |
| Merge an upstream revision                                            | [Upstream maintenance](UPSTREAM.md)                                              |
| Find dated validation, provenance, and known limits                   | [Migration record](MIGRATION.md)                                                 |
| Prepare a contribution                                                | [Contributing](../CONTRIBUTING.md) and [agent constraints](../AGENTS.md)         |

Each linked guide owns its subject; there is no separate architecture or status
file duplicating the architecture guide or migration record. Upstream package
READMEs and the [registry runbook](../apps/v4/registry/README.md) remain beside
their implementation. Website documentation is MDX under
[`apps/v4/content/docs/`](../apps/v4/content/docs/).

## Scope and evidence

The baseline for these guides was inspected on **13 October 2026**, on macOS in
`/Users/rafael/Repos/ff`, branch `main`, at Git HEAD
`295a1f114a138f23b5dfee0e0c6812394dfeb90c` **plus the existing uncommitted Form &
Field extension**. Inspection covered command definitions, providers, save and
export routes, storage, and their tests. HEAD alone does not contain the local
extension; a clone of that revision cannot reproduce it.

The [4 October migration and Advanced v2 evidence](MIGRATION.md) remains dated
historical evidence. This documentation baseline does not establish a new
browser journey, manual restore, remote release, or deployment. Check the
current diff and accepted revision in
[`form-field.upstream.json`](../form-field.upstream.json) before making a parity
or release claim.
