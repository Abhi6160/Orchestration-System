---
name: ContextBridge
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
  on-surface-variant: '#45464c'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#9d4300'
  on-secondary: '#ffffff'
  secondary-container: '#fd761a'
  on-secondary-container: '#5c2400'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001a42'
  on-tertiary-container: '#3980f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb690'
  on-secondary-fixed: '#341100'
  on-secondary-fixed-variant: '#783200'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a42'
  on-tertiary-fixed-variant: '#004395'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 280px
  content-max-width: 800px
  gutter: 16px
  space-xs: 4px
  space-sm: 8px
  space-md: 16px
  space-lg: 24px
  space-xl: 32px
---

## Brand & Style
The design system is engineered for professional developers who require high-density information environments without cognitive fatigue. The brand personality is functional, systematic, and transparent, prioritizing utility over decoration.

The aesthetic follows a **Modern Corporate/Systematic** approach:
- **Restraint:** Visual interest is generated through precise alignment and intentional color accents rather than shadows or gradients.
- **Clarity:** Every UI element must have a clear purpose. There are no "glowing" effects or AI tropes; the focus is on the data and the code.
- **Density:** The interface is optimized for desktop productivity, allowing for more information per square inch while maintaining legibility through strict typographic hierarchy.

## Colors
The palette is rooted in a neutral foundation to ensure long-term comfort during extended coding sessions.

- **Foundations:** The application background uses `#F9FAFB` to distinguish the workspace from the primary surface elements (cards, inputs, and sidebars) which use `#FFFFFF`.
- **Typography:** Deep charcoal `#111827` provides maximum contrast for reading. Secondary text should use a 60% opacity of this value.
- **Accents:** Accent colors are reserved strictly for provider identification and status indicators. 
    - **Orange (#F97316):** Represents Claude-related contexts.
    - **Blue (#3B82F6):** Represents Gemini-related contexts.
- **Borders:** Use `#E5E7EB` for all structural divisions. Avoid using color-tinted borders unless indicating an active selection state.

## Typography
This design system utilizes **Inter** for all UI elements to ensure maximum legibility across high-density layouts. 

- **Scale:** The scale is compact. `14px` is the standard body size for chat bubbles and documentation.
- **Code:** For code blocks and technical identifiers, use **JetBrains Mono**. It should be set slightly smaller than the surrounding body text (`13px`) to balance its wider character footprint.
- **Weight:** Use Semi-Bold (`600`) for headings to create clear section breaks. Use Medium (`500`) for labels and buttons to ensure they remain legible at smaller sizes.

## Layout & Spacing
The application follows a structured desktop-first layout:

- **Sidebar:** A fixed `280px` left sidebar for navigation and history. It uses a subtle background (`#F9FAFB`) and a right-hand border (`#E5E7EB`).
- **Workspace:** The central chat area is fluid but the content within it is constrained to an `800px` max-width. This ensures optimal line lengths for reading technical documentation and code.
- **Rhythm:** A strict 8px grid system manages all spacing.
- **Density:** Use `8px` (space-sm) for internal component padding and `16px` (space-md) for gaps between independent UI modules.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Subtle Outlines** rather than shadows.

- **Level 0 (Background):** `#F9FAFB` – The base of the application.
- **Level 1 (Surface):** `#FFFFFF` with a `1px` solid border in `#E5E7EB`. Used for sidebars, cards, and input containers.
- **Level 2 (Popovers):** `#FFFFFF` with a `1px` border and a very soft, highly diffused shadow (`0 4px 12px rgba(0,0,0,0.05)`). This is the only instance where shadows are permitted, used to separate floating menus from the main UI.
- **Active State:** Use a 2px border in the primary accent color or the provider color to indicate focus or selection.

## Shapes
The design uses a **Soft** shape language to bridge the gap between technical precision and modern accessibility.

- **Standard Components:** Buttons, inputs, and small cards use a `6px` radius.
- **Containers:** Large workspace panels or modals use an `8px` radius.
- **Icons:** Use 1.5px stroke weight for icons to match the weight of the Inter typeface.

## Components
- **Buttons:** 
  - *Primary:* Dark charcoal background, white text. No gradient.
  - *Secondary:* White background, gray border, charcoal text.
  - *Ghost:* No background or border. Background appears as `#F3F4F6` on hover.
- **Input Fields:** 
  - Standard state: `1px` border in `#E5E7EB`.
  - Focus state: `1px` border in `#3B82F6` with a `2px` soft outer glow in the same color (20% opacity).
- **Chips/Badges:** 
  - Small, `4px` radius. 
  - Provider badges use the accent colors (Orange/Blue) at 10% opacity for the background and 100% opacity for the text.
- **Chat Bubbles:** 
  - User messages should have a subtle background (`#F3F4F6`).
  - Assistant messages stay on a white surface with a clear provider icon at the top-left.
- **Code Blocks:**
  - Background: `#111827`.
  - Syntax highlighting: High-contrast, vibrant but limited palette.
  - Header: Includes language label and "Copy" button in a `32px` tall bar.