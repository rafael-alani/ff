# Component and example APIs

The installed fork source and TypeScript types are authoritative at the commit recorded in `form-field.upstream.json`. The website retains the official Base UI (`base`), Radix (`radix`), and React Aria (`aria`) families. Their composition APIs differ; inspect the selected source rather than assuming every component accepts `asChild`, `render`, identical selection values, or the same ref pattern.

## Source categories

- **UI components:** authored in `apps/v4/registry/bases/<family>/ui/` and described by that family's registry. Generated style-specific files apply official class recipes.
- **Composed examples and blocks:** real compositions in the official base registries and `apps/v4/examples/`. Preserve their local imports, helpers, data, assets, and providers.
- **Application templates:** larger applications under upstream template/application directories. Retaining them in the fork does not make them part of an all-components download.

The old 64-entry gallery was a Radix snapshot plus three local recipes. It is historical provenance, not the inventory contract of this fork. Do not use that list to filter the official catalog or claim equal component inventories across families.

## Preserve the implementation

Retain named exports, native props, refs, client boundaries, controlled/uncontrolled semantics, focus behavior, keyboard interaction, and original accessibility attributes. Keep `cn()` and supported variants. Advanced should customize appearance through semantic variables and stable `data-slot` boundaries; it must not replace the primitive's behavior.

Different families may omit attributes another family emits. The Advanced v2 integration adds `data-size` and `data-variant` to the authored Base UI button to match Radix and React Aria for shared sizing and outline-only borders. Inspect both raw and generated output when choosing other selectors.

## Source downloads

The selected-source archive resolves the chosen registry item and transitive source imports. The all-components option additionally includes every maintained `registry:ui` item for the selected family. Official transforms apply style, icon family, menu treatment, font markers, and direction before portable import paths are written.

Archives provide a Next.js consumer scaffold, manifest of dependencies/source, generated theme with Advanced settings, manual overrides, preset JSON, license, and required local assets. Source requiring an unsupported website-only import must fail visibly instead of silently producing an incomplete archive. External media references remain identified network dependencies. See `docs/REACT.md` for integration.

The official preview source remains the reference for example behavior. Forms, contribution charts, payout controls, savings examples, notification actions, and similar displays are demonstrations unless a consumer deliberately adds real persistence or service calls.
