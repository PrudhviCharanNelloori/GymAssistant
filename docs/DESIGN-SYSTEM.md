# Design System

## Visual Identity

Dark athletic palette with high contrast. Premium feel without being flashy.

## Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| bg-primary | `#0d0f12` | App background |
| bg-secondary | `#161a20` | Nav, secondary surfaces |
| bg-elevated | `#1e232b` | Cards |
| text-primary | `#f4f6f8` | Main text |
| text-secondary | `#9aa3ad` | Labels, captions |
| accent | `#3b82f6` | Primary actions, active nav |
| success | `#22c55e` | Completion |
| streak | `#f97316` | Streak indicators |

Defined in `src/app/shared/styles/_tokens.scss`.

## Typography

- Base font: Inter, system fallbacks
- Display sizes for weight, reps, timer (40–48px)
- Heading: 24px semibold
- Body: 16px
- Caption: 14px secondary color

## Spacing

4px base grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px.

## Touch Targets

Minimum 44×44px for all interactive elements.

## Border Radius

sm: 6px, md: 10px, lg: 16px, xl: 24px, full: 9999px

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
