# Design System & Theme Specification

> **AI SYSTEM PROMPT**: When creating, styling, or refactoring web application pages for this project, strictly follow this theme specification. Apply the exact color palette, typography hierarchy, header/hero section layouts, button components, section spacing, glassmorphic container styles, and animation behaviors defined below.

---

## 1. Theme Overview & Aesthetic Vibe
- **Theme Name**: Finovate Modern Sage
- **Aesthetic Vibe**: Professional, clean, modern corporate with a vibrant, fresh accent. Light mode dominant, emphasizing clear readability, structured layouts, and subtle depth through soft shadows and rounded elements. A touch of "freshness" is introduced by the primary lime green.
- **Key Design Signatures**:
    - Dominant light background with contrasting dark typography.
    - Vibrant lime green (`#addb1c`) as the primary brand accent and call-to-action color.
    - Softly rounded corners on all interactive elements, cards, and containers.
    - Subtle, soft box shadows for depth rather than hard borders.
    - Clean, modern sans-serif typography with clear hierarchy.
    - Generous section padding and consistent spacing for an airy, uncluttered feel.

## 2. Color Palette System
- **Primary / Brand**: `#addb1c` (HSL(78, 86%, 48%)) - Main accent for active states, primary buttons, highlights, and branded elements.
- **Secondary / Accent**: `#c3c6be` (HSL(96, 7%, 76%)) - Subtle accent for secondary buttons, inactive states, placeholder backgrounds, and very light borders.
- **Background Primary**: `#f9f8f7` (HSL(30, 33%, 97%)) - Main body and overall page background, an off-white with a hint of warmth.
- **Background Secondary / Surface**: `#c3c6be` (HSL(96, 7%, 76%)) - Used for cards, containers, input fields, and other distinct surface elements, providing a subtle contrast to the primary background.
- **Text Primary (Heading)**: `#302318` (HSL(24, 30%, 14%)) - Dark, rich brown for main headings, titles, and high-contrast text.
- **Text Secondary (Body)**: `#645039` (HSL(30, 27%, 31%)) - Medium dark brown for body text, paragraphs, and less prominent headings, ensuring readability.
- **Text Muted / Subtle**: `#918973` (HSL(92, 9%, 51%)) - Muted greenish-grey for captions, metadata, inactive links, and subtle descriptive text.
- **Borders & Dividers**: `#c3c6be` (HSL(96, 7%, 76%)) - Subtle borders for input fields, cards, and horizontal dividers.
- **Gradients**: No prominent gradients observed for backgrounds or buttons; primarily uses solid color fills for elements. If a subtle gradient is needed, it should be very gentle, e.g., for background overlays.

## 3. Typography System
- **Heading Font Family**: `Outfit`, `sans-serif` (Suggested Google Font: Outfit for its modern, geometric yet friendly appearance)
- **Body Font Family**: `Inter`, `sans-serif` (Suggested Google Font: Inter for its excellent readability across sizes and weights)
- **Monospace Font**: `JetBrains Mono`, `monospace` (Modern, clear monospace for code snippets or specific data displays)
- **Type Hierarchy**:
  - `Hero Display`: `font-size: 3.5rem` (56px), `font-weight: 700`, `line-height: 1.1`, `letter-spacing: -0.02em` (Desktop)
  - `H1 (Section Title)`: `font-size: 2.5rem` (40px), `font-weight: 700`, `line-height: 1.2` (Desktop)
  - `H2 (Card Title)`: `font-size: 1.5rem` (24px), `font-weight: 600`, `line-height: 1.3` (Desktop)
  - `H3 / Subtitle`: `font-size: 1.25rem` (20px), `font-weight: 500`, `line-height: 1.4` (Desktop)
  - `Body Regular`: `font-size: 1rem` (16px), `font-weight: 400`, `line-height: 1.6`
  - `Caption / Badge`: `font-size: 0.875rem` (14px), `font-weight: 500`, `letter-spacing: 0.05em`, `text-transform: uppercase`

## 4. Header & Navigation Bar
- **Layout & Structure**: Logo (`Finovate` with asterisk icon) positioned on the far left. Main navigation items (`Home`, `Services`, `Industries`, `About`) centrally aligned. Action buttons (`Insight`, Search icon, `Contact Us`) aligned to the far right.
- **Height & Spacing**: Desktop height approximately `80px`. Padding: `padding: 0 40px` (desktop), `padding: 0 20px` (mobile).
- **Styling & Effects**:
    - Background: Transparent over the hero section, transitioning to a solid `#f9f8f7` with a very subtle `box-shadow` on scroll.
    - Backdrop-filter: No explicit blur observed over hero, but a very subtle `backdrop-filter: saturate(180%) blur(5px)` could enhance depth when sticky over content.
    - Bottom border: None initially, but a `1px solid rgba(195,198,190,0.3)` could appear on scroll.
- **Behavior**: Sticky at the top of the viewport. On scroll, it acquires a subtle shadow. Mobile overlay nav slides in from the right/left with a full-height, slightly transparent background.

## 5. Hero Section Architecture
- **Layout Type**: Two-column split layout. Left side features prominent text and CTAs, while the right side is dominated by a background image of people in a meeting setting.
- **Headline Hierarchy**:
    - Primary headline (`Your Trusted Consulting Partner`): `Hero Display` style, using `var(--color-text-primary)`.
    - Secondary CTA text (`Free Consultation`): Styled as a primary button.
- **Call To Action (CTA) Group**:
    - A primary button (`Free Consultation`) styled as `Primary Button`.
    - A secondary, smaller button/icon (`Arrow right icon`) positioned immediately to the right of the primary button, typically with a very subtle background or outline.
- **Hero Visual Unit**: A full-width background image. The content is overlaid on top. At the bottom-left of the hero, there are three distinct pill-shaped information containers (`TRUSTED PARTNER`, `FINANCIAL SERVICES`, `INVESTING`) styled with `Background Secondary / Surface` color, `Text Muted / Subtle`, and `Border Radius Large`.

## 6. Page Layout & Section Rhythm
- **Max Container Width**: `1440px` (e.g., `max-w-screen-xl` or `max-w-7xl` in Tailwind context) for main content areas, centered horizontally.
- **Section Vertical Padding**:
    - Desktop: `py-20` (`padding-top: 80px; padding-bottom: 80px;`)
    - Tablet: `py-16` (`padding-top: 64px; padding-bottom: 64px;`)
    - Mobile: `py-12` (`padding-top: 48px; padding-bottom: 48px;`)
- **Grid Layouts**:
    - Mobile: 1-column layout for main content, 2-column for some feature sections.
    - Tablet: 2-column for feature grids, 1-column for hero.
    - Desktop: 3-column grid for features/cards observed (e.g., `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), `gap-x-8 gap-y-10`.
- **Section Types Observed**: Hero section, Feature grids (cards), General content blocks, Call-to-action banners, Footer (not visible but implied).

## 7. Component Styling Guidelines

### Buttons
- **Primary Button**:
  - Background: Solid `var(--color-primary)` (`#addb1c`)
  - Text color & weight: `var(--color-bg-main)` (`#f9f8f7`), `font-weight: 600`
  - Border Radius: `12px` (`rounded-xl`)
  - Padding: `12px 24px` (`py-3 px-6`)
  - Box Shadow & Glow: `0px 4px 15px rgba(173, 219, 28, 0.4)` (subtle glow)
  - Hover / Active Effects: `transform: translateY(-2px) scale(1.02)`, `filter: brightness(1.05)`, slightly increased `box-shadow` or `box-shadow: 0px 6px 20px rgba(173, 219, 28, 0.5)`.
- **Secondary / Outline Button**:
  - Example: "Insight" button in header.
  - Background: `var(--color-bg-surface)` (`#c3c6be`)
  - Border: `1px solid transparent` (or very subtle `rgba(195,198,190,0.5)`)
  - Text color: `var(--color-text-primary)` (`#302318`)
  - Border Radius: `9999px` (`rounded-full` / pill shape)
  - Padding: `8px 18px` (`py-2 px-4.5`)
  - Hover state: `filter: brightness(0.95)` or slight `box-shadow`.
- **Ghost / Icon Button**:
  - Styling: Text-only links with subtle `var(--color-text-secondary)`. Often paired with small arrow icons.
  - Hover fill: `var(--color-primary)` for text or icon fill.

### Cards & Containers
- **Background Fill**: `var(--color-bg-main)` (`#f9f8f7`) for most content cards. Some accent cards use `var(--color-primary)` (`#addb1c`) with white text.
- **Border**: `1px solid rgba(195,198,190,0.3)` (very subtle, almost invisible, just defining the edge).
- **Border Radius**: `24px` (`rounded-3xl`) for larger cards, `16px` (`rounded-2xl`) for smaller elements/pills.
- **Box Shadow**: `0px 8px 25px rgba(0, 0, 0, 0.05)` (soft, diffuse, subtle light grey shadow).
- **Hover Micro-Interactions**: Subtle `transform: translateY(-4px)` lift effect, potentially with a slight increase in `box-shadow` or a border highlight with `var(--color-primary)`.

### Form Inputs & Controls
- **Input Fields**:
    - Background: `var(--color-bg-surface)` (`#c3c6be`) or `var(--color-bg-main)` with subtle border.
    - Border color: `1px solid rgba(195,198,190,0.6)`
    - Focus ring color: `var(--color-primary)` with a light opacity `ring-2 ring-offset-2`.
    - Radius: `8px` (`rounded-lg`).
    - Text color: `var(--color-text-secondary)`. Placeholder color: `var(--color-text-muted)`.

## 8. Animations, Motion & Page Transitions
- **Easing & Timing**:
    - Fast transitions (e.g., button hovers, small icon changes): `150ms ease-out`
    - Normal transitions (e.g., card lifts, section reveals): `300ms cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
    - Slow transitions (e.g., complex component state changes, overlays): `400ms cubic-bezier(0.4, 0, 0.2, 1)`
- **Page Slides & Scroll Animations**:
    - Entrance animations: Subtle `fade-in-up` or `slide-in-from-bottom` for sections and components as they enter the viewport.
    - Staggered item delays: Individual items within a grid or list (e.g., feature cards) should animate in with a slight delay relative to each other for a fluid feel.
- **Interactive Micro-Interactions**:
    - Button press shrink: Buttons should slightly `scale-down` on click for tactile feedback.
    - Card tilt/hover lift: Cards should gently `lift` and `scale` slightly on hover as defined above.
    - Smooth tab indicator transition: If applicable, active tab indicators should animate smoothly between selections.

## 9. Ready-to-Use CSS Tokens (`:root`)

```css
:root {
  /* Color Tokens */
  --color-primary: #addb1c; /* HSL(78, 86%, 48%) */
  --color-secondary: #c3c6be; /* HSL(96, 7%, 76%) */
  --color-bg-main: #f9f8f7; /* HSL(30, 33%, 97%) */
  --color-bg-surface: #c3c6be; /* HSL(96, 7%, 76%) */
  --color-text-primary: #302318; /* HSL(24, 30%, 14%) */
  --color-text-secondary: #645039; /* HSL(30, 27%, 31%) */
  --color-text-muted: #918973; /* HSL(92, 9%, 51%) */
  --color-border: #c3c6be; /* HSL(96, 7%, 76%) */
  --color-accent: var(--color-primary); /* Alias for primary accent */

  /* Gradients */
  /* --gradient-primary: linear-gradient(135deg, #HEX 0%, #HEX 100%); */
  /* No explicit gradients identified, use solid colors */

  /* Typography Tokens */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-monospace: 'JetBrains Mono', monospace;

  --font-size-hero: 3.5rem; /* 56px */
  --font-size-h1: 2.5rem; /* 40px */
  --font-size-h2: 1.5rem; /* 24px */
  --font-size-h3: 1.25rem; /* 20px */
  --font-size-body: 1rem; /* 16px */
  --font-size-caption: 0.875rem; /* 14px */

  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Border Radius & Shadows */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px; /* Pill shape */

  --shadow-card: 0px 8px 25px rgba(0, 0, 0, 0.05);
  --shadow-button-primary: 0px 4px 15px rgba(173, 219, 28, 0.4);
  --shadow-button-primary-hover: 0px 6px 20px rgba(173, 219, 28, 0.5);
  --shadow-header-on-scroll: 0px 2px 10px rgba(0, 0, 0, 0.03);

  /* Spacing Tokens */
  --spacing-section-desktop: 80px; /* py-20 */
  --spacing-section-tablet: 64px; /* py-16 */
  --spacing-section-mobile: 48px; /* py-12 */
  --spacing-gutter: 32px; /* For grid gaps */
  --spacing-container-max-width: 1440px;

  /* Motion & Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1); /* ease-in-out */
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
  --hover-lift-transform: translateY(-4px);
  --button-press-scale: 0.98;
}
```