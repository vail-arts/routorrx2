# Verification — 3 November 2026

Executed on this checkout, continuing Astra’s existing Next.js source:

- ESLint: passed, zero warnings.
- TypeScript: passed through the final production build.
- Production build: passed; five primary pages, seven supporting policy routes and /app generated successfully.
- Unit tests: 6 passed (coordinates, pilot distance, polyline6 decoding, shared request cap and weather advisory).
- Local integration: passed; 9 page/asset responses plus origin rejection, oversized body, disabled AI, throttling and three service adapters. Three local fixture requests, no external load.
- Playwright: 14 passed in 8.7 seconds, Chromium desktop and emulated iPhone viewport. Covers all public/policy routes and overflow, shared homepage planner, search → route result → local report draft, persisted map modes, search dialog keyboard, carousel controls, film unavailable state/Escape focus return, reduced-motion setting, provider failure and keyboard tabs.
- Browser screenshots: test-results/home-desktop.png and home-mobile.png (generated/ignored).

Automated geographic results are explicitly intercepted fixtures. They do not establish live provider uptime, map tile availability or field route accuracy. Prior low-volume live checks are recorded in the chat, not repeated as a load test.

Not completed: real iOS/Safari/Android testing, full screen-reader/WCAG audit, security audit, Core Web Vitals/Lighthouse profiling, camera/voice permission matrix, genuine concurrent backend/database load tests, production monitoring/backups and deployed URL verification. No scalability or regulatory compliance claim follows from these tests. Node 22.12+ remains the declared supported environment; this machine executed checks with Node 20.20.2 and npm engine warnings were observed.

## Continuation verification

After Watermelon source adaptations, optional provider-style slots and OpenRouter frontend panel: lint, standalone TypeScript, 6 unit tests and final production build passed. Playwright: **16 passed in 9.2 seconds**, desktop/mobile Chromium, now failing explicitly on hydration and uncaught JavaScript errors. A reduced-motion hydration mismatch was found and fixed; the final run had no such errors. Motion's expected reduced-motion informational warning remains.

OpenRouter disconnected state and keyboard slider behavior are tested. No live OpenRouter calls, enabled authenticated assistant flow, licensed external tile styles or inference quality tests were performed. Existing local integration checks were not repeated because server endpoints were unchanged. Full WCAG, performance, device and security audits remain outstanding.

## Latest continuation — validated before GitHub handoff

- Lint and standalone TypeScript passed; production build passed.
- Unit tests: **9 passed**, including malformed API output and local-draft validation.
- Main Playwright suite: **20 passed in 12.6 seconds**, desktop/mobile Chromium. Adds one-time homepage endpoint handoff, no automatic route call, malformed-provider and corrupted-draft recovery.
- Enabled assistant Playwright suite: **4 passed in 3.9 seconds**, desktop/mobile Chromium. Tests explicit consent, minimized request payload, route-change reset, quota error, invalid response and successful retry. Initial strict-selector collisions with Next’s route announcer were corrected in the tests.
- Assistant responses were mocked; no live OpenRouter or authenticated backend integration was exercised. Server adapters were unchanged, so the earlier local integration run was not repeated. No production load, cost, accessibility or security certification is claimed.

Demo ad verification: build, lint, TypeScript, 9 unit tests, local integration checks and all 20 desktop/mobile Chromium browser checks passed. Both viewport tests played the bundled MP4 through to its natural end, checked focus return, reopened it and dismissed with Escape under reduced motion. Real iPhone Safari playback remains a device check.

## Frontend refinement

The production build passed. Lint, TypeScript, 9 unit tests and local fixture integration checks passed. Production Chromium suite: **29 passed, 1 skipped** in 26.3 seconds. The skipped mobile duplicate is a single test that already changes the viewport to 360, 768, 1024 and 1440 pixels. The enabled-assistant suite was not rerun for this refinement.

- At a 390px viewport, switching between two fixture routes six times produced 14 marker insertions in the original observation window and zero in the updated one. The original window included initial route rendering. The regression test now asserts endpoint node identity. Node churn is a rendering-work metric, not a frame-rate measurement.
- Geometry inspection found an 880×0 map host under a visible canvas. The map library’s relative positioning overrode the application rule. An explicitly sized host now fills the panel, and real pointer drag, zoom, theme and route controls passed at desktop and mobile sizes.
- Recorded command-button click to second animation frame, 8 local samples per viewport in production Chromium. Mobile range 30–33 ms, desktop range 28–36 ms. The nearest-rank p75 was approximately 32 ms in each. These samples do not measure field INP, physical phone GPU throughput or sustained FPS.
- Visually inspected rendered before/after homepage images at 390 and 1280 px. The hero now contains the original shader with stronger silver highlights. Rendering pauses offscreen and under reduced motion. The prior styling reduced opacity to .09. See [comparison](docs/qa/home-comparison.jpg).
- Browser checks include knob drag/keyboard, pin/reorder/persistence, recurring reminder add/edit/delete, radial drag, expandable plates, command destination handoff, feedback download, mobile navigation, route cache, real map zoom/pan and natural demo-ad completion. Map/search/route network fixtures make these checks reproducible.
- New images are local illustrations and a project-film still (about 56 KB on disk combined). No runtime packages were added. Physical Safari/Android testing, field performance and production geographic providers remain launch-team work.

Final source handoff: production build, lint, TypeScript, 9 unit tests and fixture integration checks passed. Desktop/mobile Playwright: 31 passed and one duplicate viewport run skipped. An additional browser smoke check verified actual WebM playback, particle exit on Home → Features, all ten photographs decoding on both gallery pages, desktop map on the left, and OpenRouter panel availability.
Fresh ZIP extraction was verified with npm ci and a production build. The enabled-assistant suite passed four additional mock-backed desktop/mobile checks in that extracted copy.

Final revision: desktop and mobile checks verified intact scene bounds during scrolling and selection from the ten-photo plate collection. Lint, types, build, nine unit tests and local integration checks passed. The duplicate viewport run remains skipped.

Wordmark revision: 35 browser checks passed and one duplicate viewport run was skipped. Checks include six interactive headings, idle versus hovered control edges and exclusion of the edge from Try Out. The intro scramble and scroll morph were also verified in Chromium. Lint, types, nine unit checks, the production build and local integration checks passed.

Glass dock revision: 39 desktop/mobile browser tests passed with one duplicate viewport run skipped. Includes scroll-direction docking, keyboard reopening, word-rotation pause, reduced motion and feature ripples. Visually checked the active metallic edge beyond its first loop. Local integration checks passed.

## Final opening and top navigation

Desktop and mobile-emulated Chromium passed 47 browser checks. One mobile repeat of the four-width layout test is intentionally skipped. Tests exercise real mouse and touch pickup across the full opening, pixels arriving in a distant corner, restoration after release, keyboard steering, reduced motion, missing WebGL, active-route alignment and link focus. Lint, TypeScript, nine unit tests, the production build and local fixture integration passed.

A local desktop trace used the same 40-step pointer sweep and Features-to-Experience switch before and after the navigation change. The underline was clipped in 14 of 67 sampled frames before and zero of 67 after. Paint events fell from 89 to 12. These are local trace counts. Field INP and physical-device frame rates remain unmeasured.

## Photo reports and route ratings

Lint, TypeScript, nine unit checks, production build and local service integration passed. Chromium passed 47 existing browser checks with one duplicate viewport case skipped, plus two new invalid-photo and feedback tests. Six tests in the enabled-services suite passed with fixture endpoints, including separate writer/reader browser sessions, a resized photo, explicit analysis, pending submission, a moderated route observation, its rating and consent-based OpenRouter references. Physical camera capture, production sessions, provider inference and cross-device production persistence require the backend and real-device verification.
