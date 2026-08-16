# Design System Inspired by Eloqwnt

## 1. Visual Theme & Atmosphere

Eloqwnt's design system embodies a sophisticated, minimalist aesthetic rooted in clarity and strategic purpose. The visual language balances bold typography with generous whitespace, creating an airy, premium feel that communicates confidence and expertise. The palette is intentionally restrained—dominated by pure black and white with carefully considered accent colors that signal interactivity and hierarchy. This approach reflects the brand's core mission: helping tech leaders cut through perception gaps with visual clarity and precision. The design favors clean lines, rounded button forms, and subtle depth, creating a system that feels both contemporary and timeless. Every element serves a strategic function, with no visual noise—a direct translation of the brand's philosophy that internal truth should become external perception through deliberate design choices.

**Key Characteristics**
- Minimalist, monochromatic foundation with strategic color accents
- Premium whitespace and breathing room throughout layouts
- Bold, geometric typography at large scales for impact
- Soft border radius on interactive elements for approachability
- High contrast for accessibility and clarity
- Tech-forward but human-centric aesthetic
- Strategic use of soft grays to create surface distinction without complexity

## 2. Color Palette & Roles

### Primary
- **Deep Charcoal** (`#23272B`): Primary text, navigation, and interface elements; the dominant semantic color conveying authority and professionalism
- **Pure Black** (`#000000`): Headlines, primary CTAs, and high-emphasis content requiring maximum contrast and visual weight

### Accent Colors
- **Sky Blue** (`#007AFF`): Secondary interactive accent; link hover states and subtle emphasis
- **Cobalt Blue** (`#2283FF`): Interactive elements, secondary buttons, and focused states
- **Electric Blue** (`#2563EB`): Tertiary accent for progressive disclosure and differentiation
- **Rose Pink** (`#EA4C89`): Tertiary accent for calls-to-action requiring emotional engagement (CTA buttons with emoji)
- **Light Periwinkle** (`#E3E3FF`): Soft background tint for accent sections
- **Pale Cyan** (`#E3F7FF`): Delicate background wash for information panels or highlights
- **Cloud Blue** (`#B5DCFF`): Mid-tone accent for borders and subtle UI separators

### Interactive
- **Ghost White** (`#FFFFFF`): Button text on dark backgrounds, high-contrast text in dark sections
- **Light Gray Surface** (`#E5E9EB`): Secondary button backgrounds, disabled states, subtle surface differentiation

### Neutral Scale
- **Off-Black** (`#171717`): Alternative deep neutral for contrast variation
- **Dark Gray** (`#222222`): Secondary text and subdued interface elements
- **Medium Gray** (`#A9ACAD`): Placeholder text, helper text, and tertiary information
- **Near-White** (`#F2F7F9`): Subtle section background tint, creating soft surface zones
- **Warm White** (`#FAFAFA`): Page background, card backgrounds, and primary surface

### Surface & Borders
- **Light Border** (`#E5E9EB`): Dividing lines, container borders, and subtle separation

## 3. Typography Rules

### Font Family
**Primary:** Mazzard (`https://fonts.googleapis.com/`), fallback stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

**Secondary:** Same as primary (monolithic approach emphasizing consistency)

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display / H1 | Mazzard | 56px | 500 | 58.8px | 0px | Hero headlines; max visual impact |
| Heading / H2 | Mazzard | 40px | 500 | 44px | 0px | Section headers; strong hierarchy |
| Heading / H3 | Mazzard | 48px | 500 | 51.84px | 0px | Subheadings; intermediate emphasis |
| Body / Large | Mazzard | 20px | 400 | 24px | 0px | Primary body text; narrative content |
| Button / Label | Mazzard | 20px | 400 | 20px | 0px | Primary CTA and interactive text |
| Navigation / Meta | Mazzard | 16px | 400 | 20px | 0px | Navigation items; secondary labels |
| Input / Placeholder | Mazzard | 14px | 400 | 16.8px | 0px | Form input text; small interface copy |
| Label / Form | Mazzard | 16px | 500 | 16px | 0px | Form labels; input descriptions |

### Principles
- **Weight economy:** Primary use of 400 (regular) with 500 (medium) reserved for hierarchy breakpoints and labels
- **Size-based scale:** Clean increments (14px → 16px → 20px → 40px → 48px → 56px) create predictable rhythm
- **Line height generosity:** Ratios of 1.2–1.3x font size ensure readability and breathing room
- **Minimalist accent:** No letter-spacing applied; rely on weight and size for distinction
- **Monospace reserved:** Code blocks use system monospace at 14px weight 400 with 1.4x line height

## 4. Component Stylings

### Buttons

**Primary Button (Solid Black)**
- Background: `#000000`
- Text Color: `#FFFFFF`
- Padding: `14.4px 24px 14.4px 24px`
- Border Radius: `500px`
- Border: none
- Font Size: `20px`
- Font Weight: `400`
- Line Height: `20px`
- Box Shadow: none
- Hover State: Opacity `0.85` on background
- Active State: Opacity `0.7` on background
- Focus State: Outline `2px solid #2563EB` at `2px` offset

**Secondary Button (Light Gray)**
- Background: `#E5E9EB`
- Text Color: `#000000`
- Padding: `14.4px 24px 14.4px 24px`
- Border Radius: `500px`
- Border: none
- Font Size: `20px`
- Font Weight: `400`
- Line Height: `20px`
- Box Shadow: none
- Hover State: Background `#D1D5D9`
- Active State: Background `#C0C4C8`
- Focus State: Outline `2px solid #2563EB` at `2px` offset

**Ghost Button (Transparent)**
- Background: transparent
- Text Color: `#000000`
- Padding: `0px`
- Border Radius: `0px`
- Border: none
- Font Size: `18.08px`
- Font Weight: `400`
- Line Height: `20px`
- Box Shadow: none
- Hover State: Text color shifts to `#2283FF`
- Active State: Text color shifts to `#007AFF`
- Focus State: Underline `2px solid #2283FF`

**Icon Button (White Text)**
- Background: transparent
- Text Color: `#FFFFFF`
- Padding: `0px`
- Border Radius: `0px`
- Border: none
- Font Size: `20px`
- Font Weight: `500`
- Line Height: `20px`
- Box Shadow: none
- Hover State: Opacity `0.7`
- Active State: Opacity `0.5`

### Navigation

**Navigation Link (Horizontal Menu)**
- Background: transparent
- Text Color: `#000000`
- Padding: `0px`
- Font Size: `16px`
- Font Weight: `400`
- Line Height: `20px`
- Border: none
- Box Shadow: none
- Hover State: Text color `#2283FF`
- Active State: Text color `#007AFF`, underline `2px solid #007AFF`
- Focus State: Outline `2px solid #2563EB`

**Mobile Menu Toggle**
- Background: `#FFFFFF`
- Border: `1px solid #E5E9EB`
- Border Radius: `50%`
- Dimensions: `44px × 44px` (touch-safe)
- Icon Color: `#000000`
- Hover State: Background `#F2F7F9`

### Inputs & Forms

**Text Input (Single-line)**
- Background: transparent
- Text Color: `#000000`
- Placeholder Color: `#A9ACAD`
- Padding: `0px 0px 9.6px 0px` (bottom border spacing)
- Border Bottom: `1px solid #E5E9EB`
- Border Radius: `0px`
- Font Size: `14px`
- Font Weight: `400`
- Line Height: `16.8px`
- Height: `38px`
- Focus State: Border bottom color `#2283FF`, shadow `0px 2px 8px rgba(34, 131, 255, 0.12)`
- Error State: Border bottom color `#EA4C89`

**Input Label**
- Text Color: `#000000`
- Font Size: `16px`
- Font Weight: `500`
- Line Height: `16px`
- Margin Bottom: `12px`

**Form Container**
- Background: `#FFFFFF`
- Padding: `32px 40px 32px 40px`
- Border Radius: `16px`
- Border: `1px solid #E5E9EB`
- Box Shadow: `0px 2px 12px rgba(0, 0, 0, 0.04)`

### Cards & Containers

**Card (Content Container)**
- Background: `#FFFFFF`
- Padding: `40px`
- Border Radius: `16px`
- Border: `1px solid #E5E9EB`
- Box Shadow: `0px 4px 16px rgba(0, 0, 0, 0.06)`
- Hover State: Box shadow `0px 8px 24px rgba(0, 0, 0, 0.1)`

**Video Card (Featured Content)**
- Background: `#000000`
- Padding: `0px`
- Border Radius: `10.08px`
- Aspect Ratio: 16 / 9
- Play Icon Color: `#FFFFFF`
- Hover State: Overlay opacity `0.05`

**Surface Section**
- Background: `#F2F7F9` or `#FAFAFA`
- Padding: `80px 0px 80px 0px` (vertical spacing)
- Border Radius: `0px` (full-width sections)

### Links

**Inline Link (Body Text)**
- Text Color: `#000000`
- Font Size: `20px`
- Font Weight: `400`
- Text Decoration: underline `1px solid #000000`
- Hover State: Text color `#2283FF`, underline color `#2283FF`
- Active State: Text color `#007AFF`

**Meta Link (Navigation Context)**
- Text Color: `#000000`
- Font Size: `16px`
- Font Weight: `400`
- Text Decoration: none
- Hover State: Text color `#2283FF`

## 5. Layout Principles

### Spacing System

**Base Unit:** `8px`

**Spacing Scale:**
- `8px` — micro gaps (inline icon spacing, tight component padding)
- `12px` — extra-small (list item gaps, label margins)
- `16px` — small (button internal gaps, form field spacing)
- `20px` — small-medium (padding in narrow containers)
- `24px` — medium (standard component padding, section dividers)
- `28px` — medium-large (feature spacing)
- `32px` — large (container padding, generous gutters)
- `40px` — extra-large (card padding, major layout sections)
- `48px` — extra-extra-large (vertical rhythm, section spacing)
- `56px` — massive (inter-section gaps, hero spacing)
- `60px` — special (vertical margin for distinct sections)
- `80px` — hero (full section vertical padding, major breathing room)

**Usage Context:**
- Horizontal padding in cards: `40px`
- Form field spacing: `20px` between inputs, `12px` between labels and fields
- Section padding: `80px` top/bottom for major sections, `56px` for subsections
- Navigation padding: `16px` horizontal gutters on desktop, `24px` on tablets

### Grid & Container

**Max Width:** `1200px` (content region); full-width for hero and hero-adjacent sections

**Column Strategy:** 12-column flexible grid at desktop, 6-column on tablet, single-column on mobile

**Section Patterns:**
- Hero section: Full-width background, centered content at max-width with `80px` padding
- Feature grid: 3 columns (desktop) with `32px` gap between cards, 2 columns (tablet), 1 column (mobile)
- Navigation container: Horizontal flex with `16px` spacing between items, right-aligned CTA buttons

**Sidebar/Two-Column:** 60% content / 40% sidebar on desktop; stacked on tablet and below

### Whitespace Philosophy

The design system prioritizes generosity with negative space as a signal of premium positioning. Sections breathe with `80px` vertical padding at full scale. Content clusters are separated by logical gaps: `48px` between distinct thought blocks, `32px` between related items. This spacing creates visual rhythm and forces focus on individual elements rather than overwhelming viewers. Mobile layouts compress proportionally but maintain relative ratios—never below `24px` top/bottom padding on sections. Form inputs receive `20px` vertical spacing to ensure comfortable touch interaction and visual separation.

### Border Radius Scale

- `0px` — utility and form inputs; input underlines and minimal UI
- `10.08px` — images and media containers; subtle softness
- `16px` — cards and container panels; standard rounded form
- `500px` — buttons; pill-shaped buttons for maximum affordance and modern feel

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat (Elevation 0) | No shadow; border `1px solid #E5E9EB` | Typography-dominant sections, navigation, dividers |
| Raised (Elevation 1) | `0px 2px 8px rgba(0, 0, 0, 0.04)` | Form inputs on focus, small UI containers |
| Card (Elevation 2) | `0px 4px 16px rgba(0, 0, 0, 0.06)` | Primary cards, panels, modal headers |
| Hover (Elevation 3) | `0px 8px 24px rgba(0, 0, 0, 0.1)` | Card hover state, floating actions |
| Modal (Elevation 4) | `0px 16px 40px rgba(0, 0, 0, 0.15)` | Modal dialogs, dropdowns, popovers |

**Shadow Philosophy:** Shadows are intentionally subtle and used sparingly. They create visual separation on interactive surfaces (cards on hover, form focus states) but never dominate. The system relies on borders, typography scale, and color contrast as primary hierarchy signals. Shadows increase opacity and blur only at higher elevation levels to signal progressive importance. This restraint maintains the premium, minimalist aesthetic while preserving accessibility and clarity.

## 7. Do's and Don'ts

### Do
- Use the `56px` H1 size exclusively for hero headline content requiring maximum visual impact
- Apply `40px` padding consistently inside card containers for uniform breathing room
- Pair typography with whitespace—ensure `24px` minimum margin below headings
- Use pill-shaped buttons (`500px` border-radius) for primary CTAs; all CTA buttons should be rounded
- Implement focus states with `2px solid #2563EB` outline on all interactive elements for keyboard navigation
- Maintain `80px` vertical padding on full-width sections for premium spacing feel
- Stack colors semantically: black for maximum emphasis, charcoal for primary UI, grays for supporting information
- Use `16px` gap between navigation items in horizontal menus
- Test form inputs with `20px` padding between fields; this ensures comfortable mobile interaction

### Don't
- Mix border-radius values inconsistently—stick to the scale (0px, 10.08px, 16px, 500px only)
- Apply shadows to flat-hierarchy elements; rely on borders and color contrast instead
- Reduce padding below `20px` in form fields or card containers—this harms scanability and touch targets
- Override typography weights without purpose; 400 and 500 are the only two used
- Use accent colors (blues, pink) in body text; keep them for interactive states and CTAs only
- Create visual hierarchy through color alone; always pair with size and weight changes
- Add decorative elements or patterns; the system prioritizes functional clarity
- Implement multi-level nesting in navigation; keep menu structures flat for clarity
- Use letter-spacing adjustments; the font and size handle distinction

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | 320px–479px | Single column, `24px` padding, `16px` gaps, H1 → 40px, buttons `14.4px 20px` |
| Tablet | 480px–1023px | 2 columns, `32px` padding, `20px` gaps, H1 → 48px, navigation stacked |
| Desktop | 1024px+ | 3+ columns, `40px` padding, full navigation, H1 → 56px, max-width 1200px |

### Touch Targets

- Minimum interactive element size: `44px × 44px` (buttons, menu items, toggles)
- Button padding: `14.4px 24px` ensures comfortable touch; translates to ~48px height minimum
- Form inputs: Height `38px` with increased padding on mobile (`16px 12px`)
- Navigation link padding: `12px 16px` to ensure tappable area
- Spacing between tappable elements: Minimum `8px` gap to prevent accidental selection

### Collapsing Strategy

**Typography Scaling:**
- H1: 56px (desktop) → 48px (tablet) → 40px (mobile)
- H2: 40px (desktop) → 32px (tablet) → 28px (mobile)
- Body: 20px (desktop) → 18px (tablet) → 16px (mobile)
- Navigation: 16px → 14px (mobile labels only if necessary)

**Layout Adaptation:**
- 3-column grid → 2-column → 1-column stacking
- Horizontal navigation → vertical stack or off-canvas menu below 768px
- Sidebar layouts → stack main content over sidebar
- Card padding: 40px (desktop) → 32px (tablet) → 20px (mobile)
- Section padding: 80px (desktop) → 56px (tablet) → 40px (mobile)

**Flexible Spacing:**
- Gaps reduce proportionally: 32px gap (desktop) → 24px (tablet) → 16px (mobile)
- Margins maintain hierarchy: 60px (desktop) → 40px (tablet) → 24px (mobile)
- Form field spacing: 20px (desktop/tablet) → 16px (mobile)

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA button:** Pure Black (`#000000`) background, white text
- **Secondary button:** Light Gray (`#E5E9EB`) background, black text
- **Navigation text (default):** Deep Charcoal (`#23272B`)
- **Navigation text (hover):** Cobalt Blue (`#2283FF`)
- **Heading text:** Pure Black (`#000000`)
- **Body text:** Deep Charcoal (`#23272B`)
- **Background (page):** Warm White (`#FAFAFA`)
- **Background (section):** Pale Gray (`#F2F7F9`) or Near-White (`#FAFAFA`)
- **Background (card):** Pure White (`#FFFFFF`)
- **Border (default):** Light Border (`#E5E9EB`)
- **Placeholder text:** Medium Gray (`#A9ACAD`)
- **Input focus ring:** Cobalt Blue (`#2283FF`)
- **Link (hover):** Cobalt Blue (`#2283FF`)
- **Accent (interactive):** Sky Blue (`#007AFF`) or Electric Blue (`#2563EB`)

### Iteration Guide

1. **Start with black text on white backgrounds** — this is the system's foundation. All hierarchy flows from weight and size adjustments.

2. **Button rule:** All CTAs must use rounded (`500px` border-radius) pill-shaped buttons. Primary is black with white text; secondary is light gray with black text.

3. **Spacing rule:** Use the scale (8px base unit multiples). Major sections get `80px` top/bottom padding. Cards get `40px` internal padding. Form fields get `20px` vertical spacing between elements.

4. **Typography rule:** H1 is always `56px` weight 500. H2 is `40px` weight 500. Body is `20px` weight 400. Never deviate from these three weights: 400 and 500 only.

5. **Color accent rule:** Blue accents (`#2283FF`, `#2563EB`, `#007AFF`) are reserved for interactive states (hover, focus, links). Gray accents (`#E5E9EB`, `#E5E9EB`) are for secondary UI. Black is for primary. Pink (`#EA4C89`) is for special CTAs only.

6. **Focus state rule:** Every interactive element must have a `2px solid #2563EB` outline at `2px` offset for keyboard navigation accessibility.

7. **Hover state rule:** Text links change color to `#2283FF`. Buttons fade to opacity `0.85`. Cards increase shadow depth from `0px 4px 16px rgba(0, 0, 0, 0.06)` to `0px 8px 24px rgba(0, 0, 0, 0.1)`.

8. **Mobile scaling rule:** Type scales down proportionally: H1 becomes `40px`, H2 becomes `28px`, body becomes `16px`. Padding reduces to `20px` in cards. Section gaps compress to `40px` minimum.

9. **Form rule:** Input borders are `1px solid #E5E9EB` with bottom-only styling (no full border). On focus, shift to `1px solid #2283FF` and add `0px 2px 8px rgba(34, 131, 255, 0.12)` shadow. Labels are `16px` weight 500 with `12px` margin-bottom.

10. **Border-radius consistency:** Only use `0px`, `10.08px` (images), `16px` (cards/panels), or `500px` (buttons). Never introduce arbitrary radius values.