# Component inventory

- PillNav adapts the VengeanceUI Spotlight Navbar for Next links, keyboard focus, a silver active marker and a vertical mobile menu.
- WordmarkParticles samples the opening’s rendered VAIL ARTS lettering for pointer and touch scattering. It draws soft point sprites in one WebGL draw call per active frame, sleeps once settled, and uses native type when reduced motion or unavailable graphics calls for it.
- Map + useMapTheme + Watermelon ContinuousTabs: MapLibre map and Light/Dark/Auto controls, shared Home/app. Appearance persists locally and syncs via storage and in-page events. Changes paint only, preserving camera and route state.
- Navigator: shared real search/routing/weather frontend and local safety/report drafts. Home embeds it; /app uses the full layout.
- Discovery: adapted Watermelon Adaptive Slider, Card Swipe and Carousel Navigator with button alternatives and synchronized indicators. The slider explicitly does not change routing because verified comfort data is absent.
- CommandSearch: Watermelon shared palette/label motion inside a native dialog, keyboard navigation, grouped links and explicit geographic search with destination handoff.
- FilmModal: native dialog with the supplied on-demand MP4 and a button-to-player transition.
- Footer + policy content: shared footer and seven supporting readable routes.

Optional licensed raster tile URLs can be configured separately for light and dark maps. Without them, existing OSM raster paint fallbacks remain. Provider entitlement and attribution still require operator review.

RouteAssistant is a frontend-only OpenRouter explanation panel. It is disabled unless NEXT_PUBLIC_ASSISTANT_ENABLED=true and calls the configured /assistant endpoint. It requires consent; sends only question/distance/duration/limited instructions; excludes contacts and exact coordinates; labels generated answers. Backend authentication, OpenRouter model selection, credentials and durable spending quotas remain backend work. No live OpenRouter request was made.

Motion, GSAP and MapLibre are runtime dependencies. Lenis, Tailwind, shadcn, Magic UI, Aceternity, React Bits, R3F and Drei remain optional engineering workflows, not installed libraries. Playwright and ESLint are development tools.

The ten additional Watermelon adaptations and four earlier controls are listed in THIRD_PARTY_NOTICES.md. Home and Impact use expandable plates. Technology contains the radial atlas. The five public pages include field-guide disclosures. Experience exports feedback and the planner owns the map reveal, route stack, preferences and schedule.
