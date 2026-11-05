---
name: premium-web-engineering
description: Implement or refine routorrX frontend pages, shared map workflows and accessible motion, then verify with lint, TypeScript, build and Playwright.
---
Read AGENTS.md and the targeted source first. Preserve the Next App Router architecture, existing adapters and browser-local privacy boundaries. Plan once and make focused changes.

Choose the smallest animation tool that meets the task: CSS for states; Motion for React layout/enter/exit when needed; GSAP + ScrollTrigger for complex timelines. Use one owner per animated property. Revert GSAP contexts and disconnect observers/listeners on unmount. Refresh scroll triggers after asset layout changes. Respect reduced motion.

Inspect Watermelon, React Bits, Magic UI and Aceternity source and licences before importing selected components. Record provenance in COMPONENT_INVENTORY.md. Do not claim an original approximation is a library integration. Prefer semantic native controls or shadcn primitives for dialogs, inputs and menus; test keyboard behavior. Do not install all libraries.

Keep native scrolling. Only add Lenis for a concrete requirement; connect its raf to GSAP ticker and ScrollTrigger.update, remove callbacks on cleanup, and preserve anchors, touch, keyboard and browser history. Do not apply smooth scrolling to map gestures.

Keep current semantic CSS tokens; add Tailwind only for selected source that actually requires it. R3F/Drei require a useful 3D interaction: lazy-load, cap pixel ratio, minimize geometry/textures/shadows, pause offscreen, and provide static/reduced-motion fallbacks.

Share Map and Navigator between Home and /app. Map appearance is independent from website appearance; changing it must preserve camera, route and points. Centralize network calls in src/lib/api.ts and interfaces in src/types/api.ts. Label local drafts, fixtures, unavailable services and unverified observations honestly. Public navigation needs no account. Authenticated community persistence belongs to the backend developer.

Verify relevant controls with Playwright at desktop and mobile sizes, including keyboard, reduced motion, dialogs, map modes, navigation, validation, errors and overflow. Stub paid/geographic requests in automated tests. Run npm run lint, npm run typecheck, npm test, npm run build, npm run test:integration and npm run test:e2e as appropriate. Report actual results and remaining manual audits; do not infer WCAG, performance or capacity certification from passing tests.
