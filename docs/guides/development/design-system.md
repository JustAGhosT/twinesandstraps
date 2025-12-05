# Design System

This document outlines the design system for the Twines and Straps SA e-commerce platform, reverse-engineered from the existing UI.

## Color Palette

The color palette is defined in `tailwind.config.ts` and is based on a primary brand color, a secondary industrial black, a steel gray accent, and a warm rope beige.

| Color       | Hex Code  | Usage                               |
|-------------|-----------|-------------------------------------|
| Primary     | `#E31E24` | Brand color, CTAs, links, highlights|
| Secondary   | `#1A1A1A` | Backgrounds, text                   |
| Accent      | `#6B6B6B` | Borders, secondary text             |
| Warm        | `#C4B8A5` | backgrounds, decorative elements      |

## Typography

The project uses a standard sans-serif font stack.

| Element         | Style                  | Usage                                 |
|-----------------|------------------------|---------------------------------------|
| Headings (h1-h3)| `font-bold`, `text-lg`   | Page titles, section headers          |
| Body Text       | `text-sm`, `text-white`  | Standard text, descriptions           |
| Links           | `text-primary-600`     | Navigational links                    |

## Spacing

The project uses Tailwind's default spacing scale. Common spacing values are:

- **`p-4`**: Padding for containers
- **`mb-4`**: Margin between elements
- **`gap-4`**: Spacing in flex and grid layouts

## Components

### Buttons

- **Primary CTA:** `bg-primary-600`, `text-white`, `rounded-lg`, `hover:bg-primary-500`
- **Secondary/Icon Buttons:** `hover:bg-white/10`, `rounded-lg`

### Cards

- `bg-white`, `dark:bg-secondary-800`, `border`, `rounded-lg`, `hover:shadow-lg`, `transition-all`

### Header

- `sticky`, `top-0`, `z-50`, `bg-secondary-900/95`, `backdrop-blur-md`

### Footer

- `bg-secondary-900`, `text-white`

This document provides a foundational understanding of the project's design system and will be used to inform UI/UX improvements.
