# Design System & Theme Specification

> **AI SYSTEM PROMPT**: When creating, styling, or refactoring web application pages for this project, strictly follow this theme specification. Apply the exact color palette, typography hierarchy, header/hero section layouts, button components, section spacing, glassmorphic container styles, and animation behaviors defined below.

---

## 1. Theme Overview & Aesthetic Vibe
- **Theme Name**: Marine Voyage Dark
- **Aesthetic Vibe**: Deep oceanic dark mode, offering a sophisticated and tranquil user experience. Features subtle transparency, clean typography, and a prominent hero section, evoking a sense of calm and discovery. Minimalist elements are balanced with rich background visuals.
- **Key Design Signatures**:
    - Dominant dark blue and teal color palette.
    - Full-bleed hero image sections with overlayed text content.
    - Clean, modern sans-serif typography with a clear hierarchy.
    - Distinctive primary action button with a solid teal background.
    - Subtle use of outlined secondary buttons and muted text for emphasis.
    - Fixed top navigation bar.

## 2. Color Palette System
- **Primary / Brand**: `#3d7e88` (HSL: 188, 38%, 38%) - Used for primary call-to-action buttons, key interactive elements, and brand accents.
- **Secondary / Accent**: `#9eb7ba` (HSL: 191, 14%, 64%) - Used for subtle highlights, badges, and muted graphical elements.
- **Background Primary**: `#193950` (HSL: 204, 53%, 20%) - Main page background, primary header background, and dark overlays for readability.
- **Background Secondary / Surface**: `#2f5a6a` (HSL: 201, 35%, 30%) - Used for secondary containers, modals, or as a base for glassmorphic cards. For glassmorphism, use `rgba(25, 57, 80, 0.6)` with `backdrop-filter`.
- **Text Primary (Heading)**: `#e3e5e7` (HSL: 210, 11%, 90%) - Headings, main titles, and prominent text.
- **Text Secondary (Body)**: `#e3e5e7` (HSL: 210, 11%, 90%) - Standard body text, paragraph content, navigation links.
- **Text Muted / Subtle**: `#9eb7ba` (HSL: 191, 14%, 64%) - Subtitles, captions, metadata, and less critical information.
- **Borders & Dividers**: `#717a86` (HSL: 215, 7%, 49%) - Subtle borders for secondary buttons, input fields, and decorative dividers.
- **Gradients**:
    - **Page Ambient Gradient**: `linear-gradient(135deg, #193950 0%, #2f5a6a 100%)` - For the general browser background, giving an atmospheric feel (though the UI itself has flat backgrounds). Not directly applied to UI components unless specified.

## 3. Typography System
- **Heading Font Family**: `Outfit`, sans-serif (Google Font)
- **Body Font Family**: `Inter`, sans-serif (Google Font)
- **Monospace Font**: `JetBrains Mono`, monospace (Google Font - for code snippets or specific data displays)
- **Type Hierarchy**:
  - `Hero Display`: 4.5rem (72px), Weight: 700 (Bold), Line-height: 1.1, Letter-spacing: -0.02em
  - `H1 (Section Title)`: 3rem (48px), Weight: 600 (Semi-bold), Line-height: 1.2
  - `H2 (Card Title)`: 2rem (32px), Weight: 600 (Semi-bold), Line-height: 1.3
  - `H3 / Subtitle`: 1.125rem (18px), Weight: 400 (Regular), Line-height: 1.5, Color: `var(--color-text-muted)`
  - `Body Regular`: 1rem (16px), Weight: 400 (Regular), Line-height: 1.6
  - `Caption / Badge`: 0.875rem (14px), Weight: 500 (Medium), Letter-spacing: 0.05em (Used for "SCROLL" and other small labels)

## 4. Header & Navigation Bar
- **Layout & Structure**: Logo (Norwegian Cruise) on the far left. Primary navigation items (`Home`, `Destinations`, `Ships`, `My Cruise`) centrally aligned. A prominent primary action button (`Find a cruise`) on the right, followed by utility icons (Search, User) on the far right.
- **Height & Spacing**: Desktop height: `80px`. Padding: `0 40px` (horizontal). Mobile height: `64px`.
- **Styling & Effects**: Background: `var(--color-bg-main)`. Appears largely opaque, but if layered over dynamic content, a subtle `backdrop-filter: blur(8px)` may be applied to create a sophisticated depth effect over dynamic content. No explicit bottom border visible.
- **Behavior**: Sticky/Fixed to the top of the viewport. No scroll shadow observed initially, but a subtle `box-shadow: 0 2px 10px rgba(0,0,0,0.2)` can be added on scroll. Mobile overlay style: A full-screen slide-in (from right) navigation menu for smaller viewports.

## 5. Hero Section Architecture
- **Layout Type**: A dominant 2-column conceptual layout. The background is a full-bleed, high-quality image (cruise ship on the ocean). The primary content block (text and CTAs) is aligned to the left, positioned on top of a dark background overlay (`var(--color-bg-main)`) for maximum readability, covering approximately 40-50% of the horizontal space.
- **Headline Hierarchy**: Features a smaller, muted `H3` style subtitle ("Your Home By The Sea") above a large, bold `Hero Display` style headline ("Lost at Sea, Found in Peace"), followed by `Body Regular` descriptive text.
- **Call To Action (CTA) Group**: Two buttons side-by-side below the text content. The first is a `Primary Button` ("Sea View Rentals"), and the second is a `Secondary / Outline Button` ("Build a house").
- **Hero Visual Unit**: A compelling background image spanning the full width and height of the hero section. An overlay (e.g., `linear-gradient(to right, var(--color-bg-main) 40%, rgba(25, 57, 80, 0.4) 100%)`) ensures text legibility while allowing the background image to shine. Subtle "SCROLL" indicator on the left edge. Social media icons (Facebook, Twitter, Instagram) subtly placed on the bottom right.

## 6. Page Layout & Section Rhythm
- **Max Container Width**: `1280px` (equivalent to `max-w-7xl` in Tailwind CSS). Content is horizontally centered.
- **Section Vertical Padding**: Desktop: `py-24` (`96px`), Mobile: `py-16` (`64px`).
- **Grid Layouts**: Not explicitly visible beyond the hero's conceptual division, but for future content, assume:
    - Mobile: 1 column
    - Tablet: 2 columns
    - Desktop: 3-4 columns (depending on content type)
    - Grid Gap Spacing: `24px` (`gap-6`)
- **Section Types Observed**: Primarily a large Hero section with a fixed header.

## 7. Component Styling Guidelines

### Buttons
- **Primary Button**:
  - Background: Solid `var(--color-primary)`
  - Text color & weight: `var(--color-text-primary)`, Weight: 600 (Semi-bold)
  - Border Radius: `8px` (`rounded-lg`)
  - Padding: `12px 24px` (`py-3 px-6`)
  - Box Shadow & Glow: `0 4px 15px rgba(61, 126, 136, 0.4)` (Subtle glow matching brand color)
  - Hover / Active Effects: Background darkens slightly (`brightness(90%)`) or shifts color `var(--color-primary-darker)`, slight `translateY(-2px)`, subtle increase in shadow/glow.
- **Secondary / Outline Button**:
  - Background: Transparent
  - Border: `1px solid var(--color-borders)`
  - Text color & weight: `var(--color-text-primary)`, Weight: 600 (Semi-bold)
  - Border Radius: `8px` (`rounded-lg`)
  - Padding: `12px 24px` (`py-3 px-6`)
  - Hover State: Background fills with `rgba(158, 183, 186, 0.1)` (subtle transparent light grey) and border color might slightly lighten.
- **Ghost / Icon Button**:
  - Styling: Text/icon color `var(--color-text-primary)` (for header icons) or `var(--color-borders)` for social icons with a circular border.
  - Hover Fill: `var(--color-primary)` (for icons without text), or text color brightens.

### Cards & Containers
- **Background Fill**: For hypothetical cards/containers, use `var(--color-bg-surface)` with `backdrop-filter: blur(12px)` and `background-color: rgba(25, 57, 80, 0.6)`.
- **Border**: `1px solid rgba(113, 122, 134, 0.3)` (Subtle, desaturated border for definition).
- **Border Radius**: `16px` (`rounded-2xl`)
- **Box Shadow**: `0 10px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset` (Layered shadow with subtle inner highlight).
- **Hover Micro-Interactions**: Subtle lift effect (`transform: translateY(-4px) scale(1.01)`) with a quick, smooth transition.

### Form Inputs & Controls
- **Input Fields**:
  - Background: `rgba(47, 90, 106, 0.3)` (translucent dark blue)
  - Border: `1px solid var(--color-borders)`
  - Text color: `var(--color-text-primary)`
  - Placeholder color: `var(--color-text-muted)`
  - Focus Ring Color: `var(--color-primary)` with `outline: 2px solid var(--color-primary)`
  - Border Radius: `8px` (`rounded-lg`)

## 8. Animations, Motion & Page Transitions
- **Easing & Timing**:
  - Fast: `150ms ease-out`
  - Normal: `300ms cubic-bezier(0.4, 0, 0.2, 1)` (Standard Material Design ease)
  - Slow: `500ms cubic-bezier(0.25, 0.1, 0.25, 1)`
- **Page Slides & Scroll Animations**:
  - Entrance animations for sections: `transform: translateY(20px) opacity(0)` to `transform: translateY(0) opacity(1)` for content blocks, triggered on scroll into view.
  - Staggered item delays: List items or grid components appear with `50ms` to `100ms` delay between each.
- **Interactive Micro-Interactions**:
  - Button press shrink: `transform: scale(0.98)` on `active` state.
  - Card hover lift: `transform: translateY(-4px) scale(1.005)` with `var(--transition-normal)`.
  - Smooth tab indicator transition: `transform` or `width` transitions for active states.
  - Icon hover: Subtle `fill` or `color` change using `var(--transition-fast)`.

## 9. Ready-to-Use CSS Tokens (`:root`)

```css
:root {
  /* Color Tokens */
  --color-primary: #3d7e88; /* Teal/Cyan */
  --color-primary-rgb: 61, 126, 136;
  --color-secondary: #9eb7ba; /* Light blue-grey */
  --color-accent: #9eb7ba; /* Same as secondary for general highlights */

  --color-bg-main: #193950; /* Dark blue-grey */
  --color-bg-main-rgb: 25, 57, 80;
  --color-bg-surface: #2f5a6a; /* Slightly lighter dark blue-grey */
  --color-bg-surface-glass: rgba(var(--color-bg-main-rgb), 0.6); /* For glassmorphic elements */

  --color-text-primary: #e3e5e7; /* Off-white */
  --color-text-secondary: #e3e5e7; /* Off-white */
  --color-text-muted: #9eb7ba; /* Muted light blue-grey */
  --color-border: #717a86; /* Medium grey for borders */

  /* Gradients */
  --gradient-page-ambient: linear-gradient(135deg, #193950 0%, #2f5a6a 100%);

  /* Typography Tokens */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --font-size-hero: 4.5rem; /* 72px */
  --font-size-h1: 3rem;    /* 48px */
  --font-size-h2: 2rem;    /* 32px */
  --font-size-h3: 1.125rem; /* 18px */
  --font-size-body: 1rem;   /* 16px */
  --font-size-caption: 0.875rem; /* 14px */

  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-hero: 1.1;
  --line-height-h1: 1.2;
  --line-height-h2: 1.3;
  --line-height-h3: 1.5;
  --line-height-body: 1.6;

  --letter-spacing-hero: -0.02em;
  --letter-spacing-caption: 0.05em;

  /* Border Radius & Shadows */
  --radius-sm: 4px;
  --radius-md: 8px; /* For buttons, inputs */
  --radius-lg: 16px; /* For cards */
  --radius-xl: 24px;

  --shadow-button-primary: 0 4px 15px rgba(var(--color-primary-rgb), 0.4);
  --shadow-card: 0 10px 30px rgba(0,0,0,0.3);
  --shadow-card-inset: inset 0 0 0 1px rgba(255,255,255,0.05); /* Subtle inner highlight for cards */
  --shadow-header-scroll: 0 2px 10px rgba(0,0,0,0.2);

  /* Spacing */
  --spacing-section-desktop: 96px; /* py-24 */
  --spacing-section-mobile: 64px;  /* py-16 */
  --container-max-width: 1280px;

  /* Motion & Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 500ms cubic-bezier(0.25, 0.1, 0.25, 1);
  --transform-hover-lift: translateY(-4px) scale(1.005);
  --filter-backdrop-blur: blur(12px);
}
```