# routorrX V2 developer handoff

Unzip the project, install Node.js 22.12 or newer, then run:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On Windows copy the environment file using File Explorer or PowerShell. Open http://localhost:3000. Build with `npm run build` and serve with `npm start`. Browser tests require `npx playwright install chromium`.

**Customization**
- Public page content lives under `src/app/(marketing)`. The home scene uses `PedestrianScene.tsx`, `paintStreet.ts` with automatic camera framing. Slides respect reduced motion.
- All ten photo captions and their display order live in `src/content/photos.ts`. Optimized photos are in `public/field`.
- To change only the fifth-page video, edit `experienceFilmUrl` below the comment **PASTE YOUR VIDEO LINK HERE** in `src/components/Experience.tsx`. Supply a direct playable media URL. The existing 15-second demo is the default.
- Try Out uses `Navigator.tsx`, `Map.tsx`, `RouteAssistant.tsx` and the app rules in `globals.css`. Set the public API base and licensed tile URLs in the environment before building. Dark fallback inverts raster lightness while drawing the route separately.
- Your backend implements `POST /assistant`. Keep OpenRouter keys on your backend. Enable `NEXT_PUBLIC_ASSISTANT_ENABLED` only after implementing authentication, consent, quotas and the response contract. See API_CONTRACT.md and BACKEND_HANDOFF.md.

## Run locally

Use Node 22.12+ (recommended; one map dependency requests Node 22). Install with `npm ci`, copy `.env.example` to `.env.local`, then run `npm run dev`. Open http://localhost:3000. `npm run build` creates the production build; `npm start` serves it. `npm test` checks critical pure logic; `npm run typecheck` checks TypeScript.

Development uses public Nominatim search, Open-Meteo weather and the FOSSGIS Valhalla demonstration endpoint when no routing URL is set. These are low-volume development conveniences, not production service guarantees. Search is explicitly submitted, not autocomplete. Search results are cached for five minutes in a bounded process-local cache. Requests are capped at 200/day/process by default, with at least 1.1 seconds between requests to each service. The map loads only after the user requests it. Do not run load tests against these services.

Production service requests fail closed until `SERVICES_ENABLED=true`. A production routing endpoint must be configured explicitly. `NEXT_PUBLIC_*` values are public and embedded at build time; never put secrets in them.

## What works

- Five responsive public pages, reusable spotlight PillNav, MasonryGallery, grayscale low-resolution WebGL domain-warped background, reduced-motion fallbacks.
- Illustrated street atlas, expandable field notes, a film still and a radial gallery on Technology. Plates are marked as project illustrations.
- MapLibre pan/zoom, map-point selection, explicit place search, geolocation on request, real pedestrian provider requests, route alternatives when returned, distance/time/instructions, browser speech on request.
- Weather on request; chosen emergency/contact dialler links; explicit fixed-location sharing; device-only trusted contacts and timestamped unverified report drafts (20 max); clearing personal data and exporting drafts.
- Try Out includes icon-labelled tools, local photo/camera attachments, “Other” road issues, optional 1–5 walk ratings and reviewed community report interfaces. Enable public reporting and photo analysis only after connecting the endpoints in API_CONTRACT.md.
- PWA manifest and PNG icons. Production service worker caches only offline recovery HTML and icons. It never caches API responses, contacts, route queries, maps or location history. Offline navigation itself is **not** implemented.
- The Watch demo ad button opens the supplied 15-second MP4 in a rounded player. Playback ends by returning to the same button. The file loads on demand.
- Feedback export as a local JSON file; no submission is claimed.

## Not implemented / not claimed

Live DeepSeek/OpenRouter inference, production photo storage, live turn-by-turn position tracking, voice commands, verified wheelchair routing, road-condition scoring, nearby essentials, public reports/moderation, authentication, database persistence, predictive intelligence and vehicle detection. No verified safety scores, impact metrics, scalability claims or native mobile binaries.

The supplied street photographs appear in Impact and Technology. The components here are original implementations of the requested behavior. The expanding gallery panel currently expands within the page width rather than taking over the entire browser viewport.

## Security and cost boundary

**Revoke/rotate the NVIDIA credential previously shared in chat.** Do not paste it into this project. `.env.example` contains only a placeholder for a newly rotated server-side key. No AI integration currently reads it; `/api/ai` returns unavailable, so AI spending is zero. A future inference endpoint must require authentication, atomic durable quotas, operator spending limits, request/image size limits, output validation, deadlines and a kill switch before being enabled.

The present API cap is intentionally small but is **not a distributed production quota**: it resets on restart and each process has its own counter. Production must add shared rate limiting, trusted client identification, hard provider-level spending caps and monitoring. No production database or RLS policies are claimed. Contacts/report drafts are browser-local, not encrypted and visible to other users of the same browser profile. Search terms are kept briefly in server memory for caching. Disable query/body logging at the hosting/proxy layer. Review privacy disclosures, provider licensing and retention before release.

## Source map

- `src/app/(marketing)` — five static public routes and shared layout.
- `src/components/Navigator.tsx`, `Map.tsx` — navigation, safety and report prototype.
- `src/app/api/[service]/route.ts` — same-origin POST adapters: search, route, weather.
- `src/lib/core.ts` — validation, polyline6 decoding, pilot radius and budgets.
- `src/components/LiquidMetal.tsx` — one lazy public-site shader; no graphics dependency.
- `public/sw.js` — narrowly scoped offline recovery.
- `HANDOFF.md` — operator setup, API contracts and release checklist.
- `TESTING.md` — actual checks and outstanding validation.

## Provider references

- [Valhalla routing API](https://valhalla.github.io/valhalla/api/turn-by-turn/api-reference/)
- [FOSSGIS demonstration services](https://www.openstreetmap.de/nutzen/dienste-osm-de/)
- [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
- [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/)
- [Open-Meteo documentation and terms](https://open-meteo.com/en/docs)

OpenStreetMap data requires attribution; production providers may have additional requirements. Verify commercial weather licensing before commercial launch.

The homepage opens with the scroll-driven Vail Arts wordmark. WordmarkParticles.tsx samples the opening typeface. Hold and drag across the opening to carry particles to the edges. Release to reform the title. The focused wordmark supports arrow keys and Escape. Touches starting outside the letters can scroll normally. StudioMotion.tsx owns the scroll transition, feature ripples and closing flip. PillNav.tsx contains the public spotlight tabs. StudioDock.tsx contains the provided YouTube channel and private GitHub URL. To address Gmail drafts automatically, set NEXT_PUBLIC_STUDIO_EMAIL before building. The Experience share sheet uses the running site's origin for links and QR codes. On localhost those URLs resolve on the same device.

The opening wordmark uses a locally installed Black Sansa Thin when available. For consistent rendering across devices, add your licensed webfont under public/fonts, set NEXT_PUBLIC_STUDIO_FONT_URL in .env.local, and rebuild. Until then the opening uses the device’s display serif fallback. Body typography is unchanged.

Homepage word rotation is in src/components/MorphText.tsx. StudioDock.tsx controls right-side dock destinations and scroll behavior: upward scroll parks the rail, downward scroll restores it, and the handle reopens it manually. Public liquid edges loop during hover using one shared texture. Try Out is excluded.
#   r o u t o r r X - V 2  
 #   r o u t o r r X - V 2  
 