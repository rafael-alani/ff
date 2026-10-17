# Design principles

Form & Field extends the official studio without changing its component identity or interaction contracts. Evaluate adjustments across forms, navigation, overlays, data display, and complete compositions together.

## Keep Essentials authoritative

The official family, style, palette, font, radius, icon, menu, direction, and related controls remain the baseline. Advanced is an additional tab in that sidebar. Every Advanced value starts unset; unset means the selected upstream style decides. Resetting Advanced must restore that appearance exactly.

## Use semantic decisions

Keep background/foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, charts and sidebar roles meaningful. Review foreground/surface pairs together in light and dark modes. Color overrides for one mode must not leak into the other or break inverted menus.

Share role-based typography, control density, border and elevation rules instead of making independent brand edits in every imported component. Keep hand-written CSS separate from generated presets. Prefer stable component slots over DOM positions. Preserve explicit example typography and layout choices when a setting is intended to adjust defaults.

## Preserve interaction

Check hover, focus-visible, selected, open, disabled, checked and invalid states. Changing elevation must preserve ring borders and focus indicators. Keep native labels and keyboard behavior. Leave upstream motion and reduced-motion handling intact. Portal-mounted menus and dialogs must inherit the active preview theme.

Review compact and wide layouts, long labels, table overflow, and real example content. Advanced sizing must preserve small/default/large variants and square icon buttons, without changing the root font size or Tailwind spacing unit. Icons retain their component-owned size and stroke treatment.

## Keep ownership explicit

Browser drafts, saved checkout defaults, and exported consumer source are different states. Show and preserve that distinction. Example interactions are local demonstrations. Consumers choose their own content, integrations and persistence, and retain ownership of copied source.
