# Design System

## Visual Identity

Light, clean, high-contrast mobile palette. Bold typography, generous rounding, subtle elevation. Premium feel without being flashy.

Reference: Home screen mock — off-white background, black/white cards, gray secondary text.

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| bg-primary | `#f5f5f5` | App background |
| bg-secondary | `#ffffff` | Nav, card surfaces |
| bg-elevated | `#ffffff` | Cards |
| bg-dark | `#000000` | Featured workout card header |
| bg-muted | `#ebebeb` | Inactive streak days, subtle fills |
| bg-achievement | `#fff8e1` | Trophy / milestone highlights |
| text-primary | `#000000` | Main text, active nav |
| text-secondary | `#777777` | Labels, captions |
| text-muted | `#aaaaaa` | Inactive nav, unit labels |
| text-inverse | `#ffffff` | Text on dark surfaces |
| accent | `#000000` | Primary actions, focus rings |
| success | `#22c55e` | Completion |
| streak | `#f97316` | Streak indicators |

Defined in `src/app/shared/styles/_tokens.scss` and exposed as CSS custom properties in `src/styles.scss`.

## Typography

- Base font: **Inter** (400, 500, 600, 700) with system fallbacks
- Greeting: 32px bold
- Heading: 24px bold
- Display sizes for weight, reps, timer (40–48px)
- Body: 16px
- Caption: 14px secondary color
- Label: 12px uppercase semibold with letter-spacing

Mixins in `src/app/shared/styles/_typography.scss`.

## Spacing

4px base grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px.

## Touch Targets

Minimum 44×44px for all interactive elements.

## Border Radius

sm: 6px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px, full: 9999px

Large cards use `2xl` (32px). Stats and compact cards use `lg` (16px).

## Elevation

Depth via subtle shadows on white cards over the off-white background — no heavy drop shadows.

## Component Inventory (Planned)

- Button, Icon button, Card
- Exercise card, Set row, Metric input, Number stepper
- Timer, Progress indicator, Badge, Streak indicator
- Bottom navigation, Search field, Filter chip
- Exercise list item, Workout list item
- Bottom sheet, Modal

Phase 1 implements: bottom navigation, placeholder page, design tokens.

## SCSS Structure

```
src/app/shared/styles/
├── _tokens.scss      # Colors, spacing, shadows, z-index
├── _typography.scss  # Font scales and mixins
└── _mixins.scss      # Touch targets, cards, focus rings
```

Global styles and CSS variables: `src/styles.scss`.
