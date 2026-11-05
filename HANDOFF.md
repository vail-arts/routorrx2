# Operator handoff

## Ownership

Frontend/source is prepared locally. Your deployment partner owns hosting, domain, production provider contracts, secrets, database, monitoring and operational readiness. The developer source archive is shared through the owner’s private GitHub repository. Hosting and domain setup remain with the deployment partner.

## GitHub handoff

Download and extract the source ZIP from the private repository. Install dependencies with `npm ci`, copy `.env.example` to `.env.local` and run `npm run dev`. Use separate frontend and infrastructure branches and review before merging. Preserve `package-lock.json` for reproducible installs. Never copy the previously disclosed API key. Decide a project license before public publication.

## Environment setup

1. Revoke the exposed NVIDIA key in its provider console. Obtain a fresh key only if future AI work is approved; the current app makes no inference requests.
2. Configure `VALHALLA_URL` to an authorized `/route` endpoint with Indian pedestrian data. Verify data freshness, coverage, TLS and usage agreement.
3. Configure `GEOCODER_URL` to a Nominatim-compatible endpoint and `PROVIDER_USER_AGENT` with an operator contact. Default search is bounded around Silvassa.
4. Set `WEATHER_URL` to a compatible Open-Meteo forecast endpoint; check commercial terms.
5. Set `NEXT_PUBLIC_MAP_TILE_URL` to an authorized raster tile template and update the attribution in `Map.tsx` for your provider.
6. Add distributed atomic rate limits, authenticated quotas where needed, gateway body-size limits, provider hard spending limits and alerts. The existing single-process cap is only a pilot safeguard. Configure the proxy to reject oversized request bodies before the app reads them.
7. Only then set `SERVICES_ENABLED=true` for production. Default `DAILY_REQUEST_LIMIT=200`, hard application maximum 2000 per process. Zero disables requests; invalid numeric configuration fails closed.
8. The supplied ad is bundled at `public/media/routorrx-15s.mp4`. Leave `NEXT_PUBLIC_FILM_URL` blank to use it. Verify inline playback on target iPhones before launch.
9. Serve HTTPS, set canonical metadata after choosing the domain, review CSP for Next inline scripts/WebGL workers and the actual providers, and redact query/location data from infrastructure logs. Do not blindly copy an incompatible CSP.

## API contracts

All APIs use same-origin `POST`, JSON, max 4096 characters after body read, 10-second upstream deadline and `Cache-Control: no-store`. Send the matching `Origin` header. GET is not supported. Frontend request timeout is 15 seconds.

| Endpoint | Body | Successful result |
|---|---|---|
| `/api/search` | `{ "query": "Silvassa" }` (3–120 chars) | `[{ "name": "…", "lat": 20.27, "lon": 73.00 }]` |
| `/api/route` | `{ "from": {"lat":20.27,"lon":73}, "to":{"lat":20.28,"lon":73.01} }` | Array of `{distance: km, duration: seconds, coordinates: [lon,lat][], steps: string[]}` |
| `/api/weather` | `{ "point": {"lat":20.27,"lon":73} }` | Open-Meteo `current`: temperature, humidity, time, weather_code |

Errors: `{ "error": "human-readable explanation" }`; 400 invalid/upstream error, 403 origin mismatch, 413 too large, 429 request budget/throttle, 503 disabled/not configured. All unknown/AI services return 503. The routing adapter uses Valhalla native `trip`/`alternates` and decodes polyline6. It does not silently substitute driving routes or fabricated geometry.

## Future data/AI integration

Do not publish local report drafts automatically. A real reports service needs consent, user authentication, PostGIS points, source/timestamps, moderation status, row-level access policies, report abuse limits and a verified-only publication view. Never promote observations to verified automatically. Plan trusted-contact sync separately with explicit consent and retention controls.

AI is intentionally unconnected. Choose a documented vision-capable model only after approval; keep credentials exclusively on the server. Do not send images or coordinates to inference without clear consent. Add per-user quotas, validated schemas, resizing/redaction, bounded concurrency and a durable spend ledger. Do not market AI observations as safe passage or collision prevention.

## Release gates still owned by the team

- Real provider coverage and walking-path review in Silvassa.
- Real-device iOS/Android PWA installation, permission denial, browser voice availability and offline recovery.
- Keyboard/screen-reader audit; real accessibility participant feedback.
- Licensed final flower and photos, plus content review of the supplied demo ad.
- Measured Lighthouse/Web Vitals and usability testing; current targets are not measured claims.
- Authorized local/staging load tests with provider mocks, then separately authorized contracted-backend tests. Never benchmark public demo services.
- Monitoring and rollback, backup/restore if a database is introduced, spending alerts and incident ownership.

No support for millions of users has been tested or asserted.
