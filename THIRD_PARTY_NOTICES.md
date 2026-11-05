# Watermelon adaptations

ContinuousTabs.tsx and DiscoveryControls.tsx adapt the following sources:
https://github.com/WatermelonCorp/watermelon-platform/tree/main/src/data/contents/animated-components
- continuous-tabs/base.tsx: LayoutGroup active-pill spring transition; controlled value, unique instance IDs and keyboard handling added.
- adaptive-slider/base.tsx: native range with spring-driven progress; routorrX palette, visible native focus and accessible labeling replace the calorie demo.
- card-swipe/base.tsx: offset/velocity swipe thresholds and spring; responsive single-card presentation, button alternatives and reduced-motion behavior added.
- carousel-navigator/base.tsx: synchronized controlled index, arrows and animated indicators; autoplay-like progress/glow removed, labels added.

No original icon dependencies or Tailwind runtime are required. Source was retrieved 3 November 2026. These are adapted components rather than unmodified copies.

MIT License

Copyright (c) 2026 Watermelon Platform Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Additional MIT adaptations follow the same Watermelon source directory and license above. Each entry refers to the original base.tsx.
- expandable-profile-card: shared card/image/title layout IDs, deferred detail reveal and a keyboard-dismissable native dialog.
- expand-details: 200/22/1.2 expansion spring, natural content height and disclosure semantics.
- radial-carousel: original angle transforms, drag multiplier, spring, stagger, responsive radii and shared image transition. Buttons and local atlas imagery replace the demo media.
- knob-slider: 72-tick angle snapping, rolling digit spring and drag blur. Pointer capture and keyboard control replace mouse-only listeners. Percentage transforms replace per-digit resize observers.
- shuffle-pinned-item: layout spring, pinned hero swap and pin feedback, with local order and accessible reorder controls.
- event-reminders: layout group, row entrances/exits and original 0.2-bounce transition adapted to a local dated schedule.
- list-stack: negative collapsed offsets, spring-driven card positions and an accessible expanded selection list of real provider alternatives.
- view-on-map: 400/30/0.8 shared-element spring from the consent button to the existing MapLibre instance.
- command-search: shared palette and label transition, 0.15-second ease-out and sectioned keyboard results inside a native dialog.
- feedback: shared rating-to-form transition and thumb-pop keyframes adapted to accessible reaction controls and local JSON export. Opening starts on activation.

These are source adaptations. Native dialog behavior, semantic elements, mobile sizing and reduced-motion handling differ from the standalone demos.

The monochrome update adapts Watermelon invite-disclosure/base.tsx from the same MIT source directory. The open/closed spring uses stiffness 800, damping 80 and mass 5/4. The badge reflects the actual number of local walk-invitation drafts. Adaptive Slider retains the original 50–350 kcal range and three visual bands in graphite-to-silver tones. Carousel Navigator uses a synchronized five-second indicator when visitors start playback. View On Map opens the shared MapLibre panel in Try Out and returns users to the selected route’s walking directions.

The ten field photographs are owner-supplied and exported as metadata-stripped WebP files.

VengeanceUI sources supplied by the owner: https://github.com/Ashutoshx7/VengeanceUI/tree/main/public/r . The locally adapted share-sheet.json uses the existing motion/react runtime and qrcode-generator. The liquid-metal.json design uses @paper-design/shaders-react for a single on-demand shader edge shared by interactive controls. Flip-text.json and ascii-glitch-ripple.json informed the local character staggering and pointer-origin scramble. The Vail Arts scroll sequence and generated scan-line portraits are original.

The public hover rim uses a compact loop rendered from the installed Paper Design Liquid Metal shader. No per-button WebGL canvases are created. Black Sansa Thin is by Authentype. The font binary is not included in this distribution.

MorphText adapts VengeanceUI's morph-text.json alpha-threshold filter, blur keyframes and staggered word timing. StudioDock adapts glass-dock.json's frosted surface and spring tooltip for the right-side vertical navigation, with keyboard and reduced-motion support. Original registry: https://github.com/Ashutoshx7/VengeanceUI/tree/main/public/r .

The public tab bar adapts the cursor light, active-page ambience from [Spotlight Navbar](https://raw.githubusercontent.com/Ashutoshx7/VengeanceUI/main/public/r/spotlight-navbar.json). The opening adapts the mask sampling and local pointer displacement from [Interactive Particles](https://raw.githubusercontent.com/Ashutoshx7/VengeanceUI/main/public/r/interactive-particles.json). The VengeanceUI reference credits Bruno Imbrizi’s Codrops Interactive Particles. Here a local point-sprite shader uses the actual wordmark as its mask and a short cursor trail as its displacement field. Only entrance, contact, resize or recovery requests frames.
