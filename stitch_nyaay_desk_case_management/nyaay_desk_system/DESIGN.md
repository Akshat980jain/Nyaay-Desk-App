---
name: Nyaay Desk System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#44474c'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#74777d'
  outline-variant: '#c4c6cc'
  surface-tint: '#525f71'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#0f1c2c'
  on-primary-container: '#778598'
  inverse-primary: '#bac8dc'
  secondary: '#835500'
  on-secondary: '#ffffff'
  secondary-container: '#feae2c'
  on-secondary-container: '#6b4500'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#101b30'
  on-tertiary-container: '#79849d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e4f9'
  primary-fixed-dim: '#bac8dc'
  on-primary-fixed: '#0f1c2c'
  on-primary-fixed-variant: '#3a4859'
  secondary-fixed: '#ffddb4'
  secondary-fixed-dim: '#ffb955'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#633f00'
  tertiary-fixed: '#d7e2ff'
  tertiary-fixed-dim: '#bbc6e2'
  on-tertiary-fixed: '#101b30'
  on-tertiary-fixed-variant: '#3c475d'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  case-number:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 32px
  gutter: 16px
  touch-target: 48px
---

## Brand & Style

The design system is rooted in the principles of **Corporate Modernism**, specifically tailored for the Indian judicial context. It prioritizes authority, trust, and clarity above all else. The visual language aims to reduce the anxiety of legal proceedings by providing a structured, predictable, and highly legible environment.

The aesthetic balance combines a deep, institutional navy with high-contrast amber accents to guide the eye toward critical actions. It avoids unnecessary decorative elements, opting instead for a "utilitarian elegance" that feels both government-sanctioned and technologically advanced. The user experience is designed to be "silent"—functional enough to stay in the background while the legal data takes center stage.

**Emotional Response:** Formal, Reliable, Decisive, Secure.
**Target Audience:** Litigants, Advocates, Court Clerks, and Judicial Administrators.

## Colors

The palette is anchored by **Deep Navy (#0D1B2A)**, used for headers, sidebars, and primary navigation to establish a foundation of authority. The **Gold/Amber accent (#F5A623)** is reserved strictly for interactive states, primary CTAs, and high-priority warnings, ensuring they stand out against the darker structural elements.

The background uses a cool **Light Gray (#F8F9FA)** to minimize eye strain during long sessions of document review. Semantic colors for status badges follow standard Indian administrative conventions:
- **Success/Approval:** Green for positive finality.
- **Urgency/Action:** Amber for pending or waiting states.
- **Finality:** Gray for disposed or closed matters.
- **Alert:** Red for rejections or critical errors.

## Typography

This design system utilizes **Inter** as its primary typeface for its exceptional legibility on small screens and its neutral, professional tone. 

A critical distinction is made for **Case Numbers and Identifiers**, which utilize a **Bold Monospace (JetBrains Mono)**. This prevents character confusion (e.g., '0' vs 'O', '1' vs 'I') which is essential in legal documentation.

For mobile-first optimization:
- Large headlines scale down to 24px (headline-md) to prevent excessive wrapping.
- All interactive labels maintain a minimum size of 14px for readability.
- Case numbers in monospace should always be treated with extra letter spacing to aid quick scanning in lists.

## Layout & Spacing

This design system follows a **Mobile-First, Fluid Grid** philosophy. On mobile devices, the layout relies on a single-column stack with 16px side margins. As the screen scales to tablet and desktop, the system transitions to a 12-column grid.

**Key Layout Rules:**
- **Navigation:** Mobile uses a fixed bottom tab bar for primary modules (Dashboard, Search, My Cases, Profile). Desktop uses a persistent left-hand sidebar in Deep Navy.
- **Header:** A dark top header remains constant across all breakpoints to house branding and global search.
- **Rhythm:** An 8px linear scale governs all padding and margins. Vertical rhythm is strictly enforced to keep data-heavy forms organized.
- **Touch Targets:** All interactive elements (buttons, inputs, menu items) must have a minimum height of 48px to accommodate mobile interaction.

## Elevation & Depth

Visual hierarchy is achieved through **Low-Contrast Outlines** and **Tonal Layering** rather than heavy shadows.

- **Level 0 (Background):** Light Gray (#F8F9FA).
- **Level 1 (Cards):** Pure White (#FFFFFF) with a subtle 1px border (#DEE2E6). No shadow is used for standard cards to maintain a clean, document-like feel.
- **Level 2 (Active/Floating):** Primary CTAs and floating action buttons use a soft, 4px blur shadow with 5% opacity to indicate interactivity without breaking the professional aesthetic.
- **Overlays:** Modals and bottom sheets use a 40% opacity Navy backdrop to focus user attention on the task at hand.

## Shapes

The shape language is consistently **Rounded (8px / 0.5rem)**. This radius is applied to:
- Container cards.
- Input fields.
- Primary and secondary buttons.
- Status badges.

This specific radius is chosen to soften the "sharpness" of legal data while maintaining enough structure to feel authoritative. Selection indicators and active states in the navigation bar should use pill-shaped (fully rounded) indicators to clearly distinguish them from content containers.

## Components

### Buttons
- **Primary:** Amber background, dark navy text. 8px radius.
- **Secondary:** Transparent background, dark navy border (1px), navy text.
- **Tertiary/Ghost:** No border, navy text, used for less frequent actions like "Cancel."

### Cards
All cards must be white with an 8px radius and a 1px gray border. Case cards should feature the Case Number in monospace at the top left, with the status badge at the top right.

### Status Badges
Small, high-contrast pills. Backgrounds use semantic colors with white text. For "Disposed" or "Gray" states, use dark gray text on a light gray background to indicate a "finalized/disabled" status.

### Input Fields
Large (48px height) fields with 8px radius. Active fields should have an Amber border (2px) to clearly indicate focus. Labels should always be persistent above the field, never just placeholder text.

### Bottom Tab Bar (Mobile)
Dark Navy background. Active icon and label should be highlighted in Amber. Icons should be 24px with clear, 12px labels underneath.

### Data Tables
In desktop views, tables should use the light gray background for headers and white for rows. Case numbers within tables must remain in the monospace font.