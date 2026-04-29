# Nimbus Whiteboard — Design System

## 1. Visual Theme & Atmosphere

Dark-mode-native canvas application inspired by Linear's depth system and Miro's collaborative whiteboard UX. The design uses a near-black canvas (#0a0a0a) where content emerges through luminance stepping. Two brand accents — gold (#c9a84c) for primary actions and cyan (#00d4ff) for data/connections — create a distinctive dual-accent identity against the monochrome depth stack.

The canvas itself IS the product. Chrome should be minimal, translucent, and non-competing. Excalidraw's hand-drawn aesthetic provides the drawing feel; our UI wraps it with Nimbusphere identity.

**Key Characteristics:**
- Dark-mode-native: #0a0a0a canvas, #111114 panels, #161619 cards, #1c1c20 elevated
- Geist Sans (variable) for UI, Geist Mono for code/data
- Dual accent: Gold #c9a84c (actions, brand) + Cyan #00d4ff (data, connections, Mermaid)
- Semi-transparent borders: rgba(255,255,255,0.05) to rgba(255,255,255,0.08)
- Glassmorphism on floating toolbars: backdrop-blur-xl + translucent backgrounds
- Canvas-first: maximize drawing area, minimize chrome

## 2. Color Palette & Roles

### Background Surfaces (Luminance Stack)
- **Canvas Black** (#0a0a0a): Excalidraw background, page background
- **Panel** (#111114): Sidebar backgrounds, navigation
- **Card** (#161619): Board cards, Excalidraw Islands, dropdown menus
- **Elevated** (#1c1c20): Hover states, active toolbar items, modals

### Brand Accents
- **Gold** (#c9a84c): Primary CTA, active states, selected tools, brand identity
- **Gold Dim** (#8a7a3a): Disabled gold states, subtle gold hints
- **Gold Bright** (#e8d5a0): Hover on gold elements, text on gold surfaces
- **Cyan** (#00d4ff): Mermaid diagram edges, data connections, export actions
- **Cyan Dim** (#0099b8): Secondary cyan states

### Text
- **Primary** (#f7f8f8): Headlines, board names, primary content
- **Secondary** (#d0d6e0): Body text, descriptions, toolbar labels
- **Muted** (#8a8f98): Timestamps, metadata, placeholder text
- **Dim** (#62666d): Disabled text, subtle labels

### Borders
- **Standard**: rgba(255,255,255,0.08) — cards, inputs, Excalidraw Islands
- **Subtle**: rgba(255,255,255,0.05) — dividers, section separators

### Status
- **Success**: #27a644 — save confirmed, deploy success
- **Warning**: #e8a317 — unsaved changes
- **Error**: #ef4444 — failed operations

## 3. Typography Rules

### Font Families
- **UI**: Geist Sans Variable (--font-geist-sans), fallback: Inter, system-ui
- **Code/Data**: Geist Mono Variable (--font-geist-mono), fallback: JetBrains Mono

### Hierarchy

| Role | Size | Weight | Letter Spacing | Use |
|------|------|--------|----------------|-----|
| Page Title | 32px | 600 | -0.7px | Board list heading |
| Board Name | 24px | 500 | -0.3px | Active board title in nav |
| Card Title | 18px | 500 | -0.2px | Board card names |
| Body | 16px | 400 | normal | Descriptions, content |
| Label | 14px | 500 | normal | Toolbar labels, button text |
| Caption | 13px | 400 | normal | Timestamps, metadata |
| Micro | 11px | 500 | 0.5px | Status badges, element counts |

## 4. Component Stylings

### Floating Toolbar (Phone)
- Position: fixed bottom, centered
- Background: rgba(22, 22, 25, 0.85) + backdrop-blur-xl
- Border: 1px solid rgba(255,255,255,0.08)
- Radius: 16px
- Padding: 8px 12px
- Icons: 24px, gold (#c9a84c) when active, muted (#8a8f98) default
- Safe area: padding-bottom for mobile notch

### Toolbar (Tablet/Desktop)
- Background: rgba(22, 22, 25, 0.9) + backdrop-blur-lg
- Border-bottom: 1px solid rgba(255,255,255,0.05)
- Height: 48px (tablet), 52px (desktop)

### Board Cards
- Background: #161619
- Border: 1px solid rgba(255,255,255,0.08)
- Radius: 12px
- Hover: border-color shifts to rgba(201,168,76,0.3) (gold tint)
- Thumbnail: 16:9 ratio, rounded-t-[12px]
- Padding: 16px

### Buttons
- **Primary**: bg-nimbus-gold text-nimbus-bg, radius 8px, px-4 py-2
- **Ghost**: bg-transparent border border-nimbus-border, radius 8px
- **Icon**: bg-transparent hover:bg-nimbus-elevated, radius 8px, p-2
- **Danger**: bg-red-500/10 text-red-400 border-red-500/20

### Export Menu
- Background: #161619
- Border: 1px solid rgba(255,255,255,0.08)
- Radius: 12px
- Shadow: 0 8px 32px rgba(0,0,0,0.4)
- Items: py-2 px-3, hover:bg-nimbus-elevated

### Mermaid Preview Panel (Desktop)
- Width: 320px, resizable
- Background: #111114
- Border-left: 1px solid rgba(255,255,255,0.05)
- Header: "Mermaid" label + copy button + collapse toggle
- Diagram area: dark mermaid theme with gold nodes, cyan edges

## 5. Layout Principles

### Breakpoints
| Name | Range | Layout |
|------|-------|--------|
| Phone | 0-639px | Full canvas, bottom floating toolbar, single-col board list |
| Tablet | 640-1023px | Full canvas, top toolbar, 2-col board list |
| Desktop | 1024px+ | Canvas + optional Mermaid sidebar, top toolbar, 3-4 col board list |

### Canvas View (board/[id])
- Phone: 100vw x 100vh canvas, floating bottom toolbar, nav hidden (swipe down to reveal)
- Tablet: 100vw x (100vh - 48px) canvas, top toolbar visible
- Desktop: (100vw - sidebarWidth) x (100vh - 52px) canvas, top toolbar + optional right sidebar

### Board List (home)
- Phone: Single column, full-width cards, floating + FAB for quick capture
- Tablet: 2-column grid, 16px gap
- Desktop: 3-4 column grid, 20px gap, sidebar with filters/tags

## 6. Depth & Elevation

| Level | Background | Border | Use |
|-------|-----------|--------|-----|
| 0 (Canvas) | #0a0a0a | none | Page background, Excalidraw canvas |
| 1 (Panel) | #111114 | border-subtle | Sidebars, navigation |
| 2 (Card) | #161619 | border-standard | Board cards, Islands, dropdowns |
| 3 (Elevated) | #1c1c20 | border-standard | Hover states, active items, modals |
| Float | rgba(22,22,25,0.85) + blur | border-standard | Floating toolbar, quick capture |

## 7. Do's and Don'ts

### Do
- Maximize canvas area — every pixel of chrome you add takes from drawing space
- Use gold for actions the user initiates (create, save, export)
- Use cyan for data/system outputs (Mermaid diagrams, connection lines, deploy status)
- Apply backdrop-blur on floating elements for depth without opacity
- Auto-save silently — only show indicator on failure
- Adapt toolbar complexity to device (fewer tools on phone, more on desktop)

### Don't
- Don't use pure white (#ffffff) for text — use #f7f8f8
- Don't show desktop-sized toolbars on phone — use the floating bottom bar
- Don't block the canvas with modals — use slide-in panels or bottom sheets
- Don't use solid colored backgrounds on dark surfaces — use translucent rgba
- Don't mix gold and cyan in the same interactive element
- Don't show Mermaid preview panel on phone — it's desktop/tablet only

## 8. Responsive Behavior

### Touch Targets
- Phone: minimum 44x44px tap targets, 8px spacing between toolbar icons
- Tablet: 40x40px minimum, stylus-friendly precision
- Desktop: standard click targets, keyboard shortcuts primary

### Gestures
- Phone: pinch-zoom (Excalidraw native), swipe-down to reveal nav, long-press for context menu
- Tablet: pinch-zoom, two-finger pan, Apple Pencil for drawing
- Desktop: scroll-zoom, click-drag pan, keyboard shortcuts (T=text, N=sticky, R=rectangle)

## 9. Agent Prompt Guide

### Quick Color Reference
- Canvas: #0a0a0a
- Panel: #111114
- Card: #161619
- Primary Action: Gold #c9a84c
- Data/Connection: Cyan #00d4ff
- Text: #f7f8f8 / #d0d6e0 / #8a8f98
- Border: rgba(255,255,255,0.08)

### Example Component Prompts
- "Board card: #161619 bg, 1px solid rgba(255,255,255,0.08), 12px radius. Title 18px Geist Sans weight 500 #f7f8f8. Timestamp 13px weight 400 #8a8f98. Hover: border shifts to rgba(201,168,76,0.3)."
- "Floating toolbar: fixed bottom center, rgba(22,22,25,0.85) bg + backdrop-blur-xl, 1px solid rgba(255,255,255,0.08), 16px radius. 5 icons at 24px, gold when active, #8a8f98 default."
- "Export button: bg #c9a84c, text #0a0a0a, 8px radius, 14px Geist Sans weight 500. Hover: brightness 1.1."
