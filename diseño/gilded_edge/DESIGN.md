# Design System Document: The Obsidian Atelier

## 1. Overview & Creative North Star
**Creative North Star: "The Obsidian Atelier"**
This design system moves away from the generic "barber shop app" template to create a digital space that feels like a private, high-end grooming club. The aesthetic is rooted in **Silent Luxury**—where quality is felt through breathing room, tactile depth, and cinematic typography rather than decorative clutter. 

We break the "standard" mobile grid by utilizing intentional asymmetry, overlapping elements (such as a razor-thin gold accent line cutting through a dark surface), and a high-contrast typographic scale that mirrors premium editorial magazines.

## 2. Colors & Atmospheric Depth
The palette is built on a foundation of deep carbon blacks and liquid gold, utilizing Material Design 3 token logic to manage depth without relying on structural lines.

### The "No-Line" Rule
**Strict Prohibition:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
- **Background Color Shifts:** Placing a `surface-container-high` card on a `surface` background.
- **Negative Space:** Using the Spacing Scale to create distinct content groupings.
- **Tonal Transitions:** Subtle vertical gradients that guide the eye downward.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of matte obsidian glass.
- **`surface-container-lowest` (#0E0E0E):** Used for the deepest background layers or "recessed" areas like input fields.
- **`surface` (#131313):** The primary canvas for all screens.
- **`surface-container-high` (#2A2A2A):** Used for elevated cards or floating interactive elements to create a natural lift.

### The "Glass & Gradient" Rule
To elevate CTAs beyond "flat" buttons, use subtle linear gradients transitioning from `primary` (#F2CA50) to `primary-container` (#D4AF37) at a 135-degree angle. For floating navigation or overlays, apply **Glassmorphism**: use `surface_variant` at 60% opacity with a `20px` backdrop-blur to allow the rich background tones to bleed through.

## 3. Typography
The typography strategy pairs the architectural weight of **Manrope** for displays with the functional clarity of **Inter** for utility.

- **Display & Headlines (Manrope):** These are your "Hero" moments. Use `display-lg` and `headline-lg` with tight letter-spacing (-0.02em) to evoke a sense of authority and prestige.
- **Body & Labels (Inter):** Used for appointment details and descriptions. Maintain generous line height (1.5x) to ensure the text feels "expensive" and legible against the dark background.
- **The Signature Quote:** Use `title-lg` in italics for barber bios or service descriptions to introduce a human, artisanal touch to the technical layout.

## 4. Elevation & Depth
In this system, depth is a feeling, not a drop-shadow effect.

### Tonal Layering
Instead of traditional shadows, achieve hierarchy by "stacking." A `surface-container-highest` button sitting on a `surface-container-low` section provides enough contrast to signify interactability without the need for heavy-handed CSS effects.

### Ambient Shadows
When an element must "float" (e.g., a modal or a primary action button), use **Ambient Shadows**:
- **Color:** A tinted version of `surface_container_lowest` (Black at 40% opacity).
- **Blur:** Large, diffused values (30px–50px) with 0 offset.
- **Result:** A soft glow that feels like natural light hitting a dark object, rather than a "drop shadow" sticker.

### The "Ghost Border" Fallback
If a container requires a boundary for accessibility, use a **Ghost Border**: The `outline-variant` token at 15% opacity. It should be felt rather than seen.

## 5. Components

### Buttons (The "Golden Touch")
- **Primary:** High-contrast `primary` background with `on-primary` text. Use `xl` (1.5rem) rounded corners.
- **Secondary:** `surface-container-highest` background with `primary` text. No border.
- **Tertiary:** Transparent background, `primary` text, underlined with a 2px offset.

### Cards & Appointment Slots
- **Rule:** Forbid the use of divider lines.
- **Execution:** Use `surface-container-low` for the card body. Use vertical white space (24px+) to separate the time from the service name. Group related information using a `primary` color vertical accent bar (2px width) on the far left of the active selection.

### Input Fields
- **Style:** Underlined only. Use `outline` color for the inactive state. Upon focus, the line transitions to `primary` (Gold) and the label floats using the `label-md` scale.
- **Error State:** Use the `error` token (#FFB4AB) only for the text and the underline; do not wrap the entire field in a red box.

### Signature Component: The "Service Scroller"
Instead of a standard list, services should be presented as large-format tiles using `headline-sm` typography, overlapping a desaturated image of the haircut style. The text should remain `on-surface` (White) to ensure a high-fashion editorial look.

## 6. Do's and Don'ts

### Do:
- **Embrace Asymmetry:** Align headings to the left while keeping CTAs anchored to the bottom right to create a dynamic flow.
- **Use "Micro-Gold" Accents:** Use the gold `primary` color sparingly—for icons, active states, and branding—to maintain its "premium" impact.
- **Prioritize Breathing Room:** If a screen feels crowded, increase the spacing rather than shrinking the text.

### Don't:
- **Don't use pure #000000:** It kills the "matte" premium feel. Always use the `surface` tokens.
- **Don't use standard dividers:** Never use a horizontal line to separate list items; use a 4px-8px gap of `surface-container-lowest` or simple padding.
- **Don't use "System" Icons:** Avoid generic, filled icons. Use only Linear (Outline) iconography with a 1.5px stroke weight to match the "Golden Razor" brand identity.