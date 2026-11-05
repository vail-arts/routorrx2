# Backend integration handoff

The owner’s final scope is frontend only. No database, auth service, account creation or deployment is provisioned here. See API_CONTRACT.md and HANDOFF.md for provider setup. Replace the API base or development adapters without rebuilding the shared planner.

Implement authentication/session handling, report submission/moderation, verified-only public conditions and paginated nearby facilities. Enforce authorization on the server, retain source/timestamps, add spatial indexes and bounded viewport queries, use connection pooling and distributed rate limits. Do not expose contact records or private user location history in public reports. Local drafts must require explicit user consent before upload.

Select production tile/routing/weather providers and review their licences and commercial limits. Map appearance currently uses grayscale/brightness adjustments on attributed OSM raster tiles. This is not a pair of independent licensed vector styles. For full warm-natural/charcoal cartography, supply compatible light/dark styles and migrate the shared Map component while preserving camera/source/layer state. Do not reset routes during style switching.

OpenRouter remains a planned server contract from the previous request. Choose a current supported model, keep OpenRouter_API_KEY server-only, add user consent and authenticated durable quotas, and enforce provider spending limits before enabling. Do not make paid calls without owner approval. NVIDIA’s previously exposed key must be revoked/rotated and never reused.

Before release: finalize operator/support/privacy contacts; review editable policy content in src/content/policies.ts; verify Indian privacy-law commencement and children’s data handling with qualified counsel. Official MeitY DPDP rules and enforcement notifications are the source of truth; do not infer full compliance from a template. Configure retention, consent withdrawal, account deletion, abuse/appeal workflows, incident ownership, logging redaction, backups and restore checks.

Production monitoring, load tests, HTTPS, domain and deployment remain your responsibility. Load-test your own mocks/staging first; never public demo geographic services. Report measured latency/error/resource/cost results. No rewards, hosting credits or award subscriptions were verified or redeemed in this frontend task; no collection guide was provided. No fees or deployment were authorized by this handoff.

GitHub collaboration: use frontend/routorrx-v2 for this UI and backend/integration for your implementation, with reviewed PRs. No remote or existing git history was found here; branch creation and pushing require a repository choice. Keep .env.local, browser reports and generated map workers out of Git. Build/dev scripts regenerate the worker from the pinned MapLibre package.

## Continued frontend implementation

The OpenRouter UI now exists in RouteAssistant.tsx with typed request/response and explicit consent. Its service remains disabled; implement /assistant before enabling the public UI flag. A change of route clears stale answers. No provider key belongs in client configuration.

Map.tsx now supports NEXT_PUBLIC_MAP_LIGHT_TILE_URL, NEXT_PUBLIC_MAP_DARK_TILE_URL and NEXT_PUBLIC_MAP_ATTRIBUTION. Supply licensed raster style templates (not a style JSON URL). Optional sources are initialized once and appearances switch by opacity; points, routes and camera are preserved. This supersedes the earlier recommendation to replace Map.tsx for raster style integration. Vector style migration remains optional future work. Do not assume a public URL confers production usage rights.

Watermelon source-backed adaptations are now integrated; see THIRD_PARTY_NOTICES.md and COMPONENT_INVENTORY.md. No paid API or hosting action occurred.

The frontend can operate the new Activities tab without account services. No change to the search, walking route or weather response is required. A one-minute cache of up to eight route responses lives within the planner and is cleared with personal data. Duration matching uses provider distance and an explicit pace in km/h. Production verification of shade, kerbs, time-of-day comfort and emergency dispatch is outside this interface.

Before enabling optional account sync, agree on the owner-only settings/reminder/saved-walk endpoints in API_CONTRACT.md, timezone handling, deletion and permission-based migration. Current local records and exported feedback must never be uploaded silently.

Destination weather still calls POST /weather with a Place under point. Selection opens the weather panel and a separate refresh action authorizes the provider request. Impact converts the visitor's entered tracker rate to a duration and carries that preference into the planner. Feedback drafts and share controls are browser-only. No new backend API is needed for the studio intro, disclosure animations or QR generation.

### Connecting photo reports

Implement the three community endpoints in API_CONTRACT.md before enabling their public flags. Supply stable route IDs from routing. Publish only approved submissions, index by route ID and moderation state, and paginate newest first. Authentication is required for writes and photo analysis; guest readers can request approved observations. For separate origins, configure trusted-origin CORS, credentialed sessions and CSRF protections. Validate location, photo dimensions/type/decoded size and rating on the server. Strip metadata, review faces and plates, restrict original-image access and set retention before enabling writes.

OpenRouter analysis must use a backend-approved vision-capable model or image-to-text adapter, with private server credentials, hard quotas and timeouts. Leave the feature disabled until configured and tested. A suggested observation is separate from moderation. OpenRouter may reference approved reports only after consent. No provider SDK or server secret ships to the browser.
