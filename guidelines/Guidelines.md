1. Product overview

Tono is a responsive (web + mobile) live color picker and palette generator. It samples real colors from a live camera feed (the default) or an uploaded photo, and turns them into an exportable palette.

Core loop: point the live camera (or load a photo) → trackers sample colors live → colors collect into a palette in the sidebar → export.


On launch, Tono opens straight into the live camera and automatically detects the most representative colors in view, placing tracker pins on them in real time. No manual setup required.
As the camera moves, trackers and their sampled colors update live.
Each tracker picks one color; all picked colors appear as cells in the right-edge colors sidebar.
Manual dragging is an override to fine-tune which zone a tracker samples — "Drag to the color you want."
Tapping a color (cell or tracker) reveals its HEX with one-tap copy; HEX/RGB/HSL toggle and an optional shade carousel (lighter/darker tonalities) are available as a detail.


Feel: the camera/photo supplies the color, so the UI chrome is clean and minimal (see moodboard, §3) with one bold TONO brand accent.


2. Tech stack & project conventions

Matches the existing project structure:

guidelines/              → this spec
src/
  app/
    App.tsx              → root component, screen/state orchestration
    components/          → all React components (one component per file)
  imports/               → static assets, sample images, icon imports
  styles/
    fonts.css            → @font-face / font imports
    index.css            → global base + resets
    tailwind.css         → Tailwind layers + utility extensions
    theme.css            → design tokens as CSS custom properties (source of truth)
ATTRIBUTIONS.md
package.json
postcss.config.mjs
vite.config.ts

Conventions:


TypeScript + React function components; one component per file in src/app/components.
Tailwind for layout/utilities; design tokens live in theme.css as CSS variables, surfaced through Tailwind theme extensions.
Keep App.tsx thin: screen/state orchestration + composition. Logic lives in components/hooks.
No backend; no auth; no persistence beyond in-memory state.
Real device APIs are in scope for camera and upload (see §6 and §12), with graceful fallbacks.



3. Design system

Clean & minimal chrome (per moodboard) with one bold TONO accent. Define all values in theme.css.

Visual reference (trackers & overall picker feel)

Match the clean, minimal color-picker aesthetic from this moodboard — Pantone-style swatches, crisp pickers, toolbar-driven tools:
https://dribbble.com/badaguada/collections/7871762

Color tokens

--color-ink:        #14141A   /* primary text / base chrome */
--color-slate:      #3A3A46
--color-mist:       #9A9AA8
--color-cloud:      #F4F4F7   /* light surface */
--color-white:      #FFFFFF

--color-accent:     #FF2D95   /* TONO brand accent — hot magenta */
--gradient-brand:   linear-gradient(120deg, #FF6B6B 0%, #FF2D95 50%, #7B2FF7 100%);

--color-success:    #34D399
--color-warning:    #FBBF24
--color-danger:     #F87171

Floating chrome over media: translucent panels with backdrop blur so controls stay legible over any image.

--glass-dark:  rgba(20,20,26,0.55);    /* + backdrop-blur 16px */
--glass-light: rgba(255,255,255,0.65); /* + backdrop-blur 16px */
--border-hairline: rgba(255,255,255,0.16);

Color tracker style (important)


Minimal concentric double-ring "loupe" / reticle: a thin crisp inner ring + a slightly larger outer ring.
Center is filled with the live sampled color; soft drop shadow so it reads over any image.
On focus/drag, show a small hex label pill near the tracker.
Crisp, neutral strokes (white/hairline) — not heavy or playful. Keep it Pantone-clean.


Colors sidebar swatch style


Pantone-style cells: a solid color block with a small hex caption. One cell per tracker, stacked vertically.


Typography


Display / headings: Space Grotesk. Body / UI: Inter. Hex codes: JetBrains Mono / ui-monospace.
Scale (rem): display 2.5 / h1 2 / h2 1.5 / h3 1.25 / body 1 / small 0.875 / caption 0.75.


Spacing, radius, shadow, motion


Spacing (px): 4, 8, 12, 16, 24, 32, 48, 64.
Radius: sm 8 · md 16 · lg 24 · pill 999.
Shadows: soft, low-spread; shadow-card for panels, shadow-pop for popovers, subtle shadow on trackers.
Motion: spring transitions; 150–250ms taps, 250–400ms panels; tactile feedback on drag, tap-to-copy, stepper, shuffle.



4. Layout (per sketch)

A single editing surface, not multiple full screens:


Canvas — the live camera or uploaded photo, full-bleed, fills the surface. Tracker pins overlay it.
Floating taskbar — pill-shaped, glassy/blurred, centered at the bottom. Contents, in order:
[camera] [upload] · ( − 5 + stepper ) · ( Export Palette ) · ( shuffle )
Colors sidebar — docked to the right edge, full height; a vertical stack of swatch cells (one per tracker). Tapping a cell copies its hex (Toast) and can open the HEX detail popover.


Responsive


Desktop/tablet (wide): colors sidebar docked to the right edge (vertical stack of cells); canvas fills the rest; the taskbar is a single floating pill at the bottom-center → [camera] [upload] · ( − 5 + ) · ( Export Palette ) · ( shuffle ).
Mobile (≤640px): the colors strip moves to the TOP — a full-width horizontal row of vertical color cells (one per tracker). The canvas sits below it. Controls dock at the bottom in two rows:

Row 1: [camera] [upload] on the left, ( shuffle ) on the right.
Row 2: ( − 5 + ) stepper and ( Export ) button.
HEX detail opens as a bottom sheet.



One shared component system across breakpoints — only the arrangement changes (colors: right edge → top; taskbar: one row → two rows). No separate codebases.



5. Component inventory

Build these in src/app/components:

ComponentResponsibilityAppShellLayout frame; responsive arrangement of canvas, taskbar, and colors sidebar.CameraCanvasRequests the device camera (getUserMedia) and renders the live feed full-bleed. Handles permission + fallback.PhotoCanvasRenders an uploaded/selected image full-bleed (shares sampling logic with CameraCanvas).TrackerLayerManages all tracker pins over the canvas; auto-detection, drag, live sampling.TrackerPinMinimal concentric loupe/reticle; center = live sampled color; hex pill on focus; draggable.TrackerHintTooltip near a tracker: "Drag to the color you want."FloatingTaskbarBottom controls: one bottom-center pill on wide screens; on mobile, splits into two rows (row 1: camera + upload left, shuffle right; row 2: stepper + Export).TrackerStepperThe − 5 + control (range 3–10, default 5); adds/removes trackers + sidebar cells.ShuffleButtonRepositions all trackers AND re-picks a new color for each.UploadButtonOpens OS gallery/file explorer via a real file input.CameraButtonSwitches source back to the live camera (re-requesting permission if needed).ColorsSidebarSwatch cells, one per tracker: a vertical stack on the right edge (wide screens); a full-width horizontal strip of vertical cells at the top on mobile.SwatchCellPantone-style color block + hex caption; tap to copy / open detail.HexPopoverHEX with HEX/RGB/HSL toggle, copy button, optional shade carousel (lighter/darker).ExportSheetOpened by Export Palette: copy HEX, CSS vars, PNG card, .ASE, share link, with preview.ToastTransient "Copied!" / status confirmation.


6. Core interactions & states


Camera (real): on first use, request the device camera via getUserMedia and show the browser permission prompt. On grant, stream the live feed as the canvas. On deny/unavailable, fall back to a vivid sample image and show a small "Enable camera" affordance.
Upload (real): the upload button opens the OS gallery / file explorer via <input type="file" accept="image/*"> (use the capture attribute on mobile so it can reach the camera roll). The selected image becomes the canvas and runs the same detection.
Auto-detect: when a source is active, detect representative colors and place trackers automatically; update live for the camera feed.
Stepper (− 5 +): sets the number of trackers/colors (3–10, default 5). Adds/removes both pins and sidebar cells.
Drag override: dragging a pin re-samples the color under its new position live.
Shuffle: moves all current trackers (count from the stepper) to new positions and picks a new color for each; the colors sidebar updates to the new set.
Tap color (cell or tracker) → HexPopover: HEX/RGB/HSL toggle, copy button (fires Toast), optional shade carousel.
Export Palette: opens ExportSheet (see §8).
States: handle camera loading, permission-denied (fallback), and empty/no-color gracefully.



7. Data model & sample content

tstype ColorValue = { hex: string; rgb: string; hsl: string };

type Tracker = {
  id: string;
  x: number;            // 0–1 relative position on canvas
  y: number;            // 0–1
  color: ColorValue;    // the picked color
  shades?: ColorValue[]; // optional tonalities (dark → bright), shown on demand
};

type Palette = {
  id: string;
  name: string;
  colors: ColorValue[]; // one per tracker
  createdAt: string;
};


Provide a vivid, color-rich sample image (sunset, market stall, fashion shot) as the camera fallback and a demo photo so picked palettes look striking.
Optional: 2–3 saved palettes with realistic hex values.



8. Export

Opened by the Export Palette button in the taskbar. Options:


Copy all HEX (newline-separated list).
Copy as CSS variables (--color-1: #...;).
Download PNG palette card (with a styled preview).
Export .ASE (Adobe swatch).
Share link.


Show a live preview of the palette card. Clipboard copy is real; file/share actions may be mocked visually if the environment blocks them.


9. Accessibility


Color is never the only signal; pair every swatch with a visible hex label.
All controls keyboard-reachable; visible focus states; hit targets ≥44px.
Sufficient contrast for chrome over media (use the glass/blur tokens).
Copy/shuffle announce status via Toast + an aria-live region.



10. Copy & tone

Friendly, energetic, confident — short and human, not corporate. Microcopy: "Copied!", "Drag to the color you want", "Export Palette", "Shuffle colors", "Enable camera".


11. Device APIs & mocking notes


Camera: real getUserMedia with permission prompt; graceful fallback to a sample image if denied or unavailable (e.g., in a sandboxed preview).
Upload: real file input opening the gallery / file explorer.
Export: clipboard copy is real; PNG/.ASE downloads and share link may be visual/mocked if blocked.
No backend, no auth, no persistence beyond in-memory state.