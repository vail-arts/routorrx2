# Frontend / backend contract

Frontend models: `src/types/api.ts`; all geographic requests: `src/lib/api.ts`. Configure `NEXT_PUBLIC_API_BASE_URL` (default `/api`). No secret belongs in a NEXT_PUBLIC variable. Existing same-origin adapters remain for development; backend replacement must preserve these shapes or adapt the centralized client.

## Connected development adapters

All use POST JSON. Public exploration requires no authentication. Coordinates are decimal degrees, route geometry is [longitude, latitude], distance is km, duration is seconds.

| Path | Request | Response |
|---|---|---|
| /search | `{query:string}` (3–120 chars) | `Place[]`: `{name,lat,lon}` |
| /route | `{from:Place,to:Place}` | `WalkRoute[]`: `{distance,duration,coordinates:[number,number][],steps:string[]}` |
| /weather | `{point:Place}` | `{temperature_2m,relative_humidity_2m,time,weather_code}` |

Empty arrays mean no result. Alternatives appear only if returned. No safety ranking or verified condition layer is inferred. Production adapters require SERVICES_ENABLED and configured routing. Cross-origin backends must permit the exact frontend origin and OPTIONS/POST/Content-Type. Credentials are currently same-origin; select and document cookie/token authentication with the backend developer before enabling cross-origin accounts.

## Planned interfaces — not connected or silently mocked

| Path | Method | Authentication | Request / result |
|---|---|---|---|
| /session | GET | Optional | `Session` with user or null |
| /auth/login | POST | Provider flow | Backend-selected provider challenge/redirect; finalize provider before UI integration |
| /auth/logout | POST | Required + CSRF | Ends session; 204 |
| /reports | GET | Public verified view | bbox, cursor, limit ≤50; `PageResult<CommunityReport>`; exclude private fields |
| /reports | POST | Required | `{type,note,point}`; returns pending report; never verified by client |
| /reports/:id | DELETE | Owner/moderator | 204; server authorization required |
| /conditions | GET | Public | bbox/cursor; verified observations with source, observedAt, verifiedAt |
| /nearby | GET | Public | lat/lon/category/cursor; attributed geographic facilities, no invented records |
| /preferences | GET/PATCH | Required | Map appearance and explicitly consented preferences; never trusted contacts by default |
| /feedback | POST | Public with abuse controls | `{category,message}`; receipt id; current UI exports a file instead |
| /assistant | POST | Required, budgeted | Optional OpenRouter route explanation from bounded route facts; currently unconnected, no key requested by browser |

Error format: `{error:string,code?:string,requestId?:string}`. Use 400 invalid, 401 unauthenticated, 403 forbidden, 404 missing, 413 too large, 429 throttled with Retry-After, 503 unavailable. Existing adapters use the human-readable error field and 15-second client deadlines. Never return credentials or provider raw error bodies.

No API fixtures are presented as live production data. Playwright fixtures are restricted to automated tests. Local report drafts are distinct from server CommunityReport objects and never automatically uploaded.

## OpenRouter frontend explanation contract

`POST /assistant` body: `{question:string,route:{distance:number,duration:number,steps:string[]}}`; response: `{answer:string}` (nonempty, max 6000 characters). The UI bounds questions to 500 characters and instructions to 30 entries. No coordinates, contacts or images are included. Instructions may contain street names; the consent notice explains this. Treat all inputs as untrusted and validate independently on the backend. Never infer verified safety or accessibility from an explanation.

The interface is gated by `NEXT_PUBLIC_ASSISTANT_ENABLED=false` by default. Enabling the flag is not authentication or a budget safeguard. The backend must enforce authenticated sessions, CSRF/CORS policy, token/request limits, timeouts, a supported OpenRouter model and durable spending caps. Existing local development `/api/assistant` returns 503; it does not invoke OpenRouter. Add a backend endpoint before enabling the UI. Browser renders plain text only and rejects malformed responses. Live model quality/authenticated flows have not been tested.

### Activity tools and optional future account sync

Current local models are in `src/types/walk.ts`. The UI runs entirely on device for these actions. Optional future authenticated endpoints are described here for backend planning.

| Method and path | Request | Response |
|---|---|---|
| GET /me/walk-settings | none | { preference: {pace, minutes}, routines: Routine[] } |
| PUT /me/walk-settings | same shape, ordered routines with stable ids and pin flags | validated settings |
| GET /me/reminders | cursor, limit | { items: Reminder[], nextCursor } |
| POST /me/reminders | name, local date/time, IANA timeZone, repeat (Once/Daily/Weekly) | created reminder with server id and timeZone |
| PATCH or DELETE /me/reminders/:id | editable fields or no body | updated reminder or 204 |
| GET /me/saved-walks | cursor, limit | { items: SavedWalk[], nextCursor } |
| POST /me/saved-walks | from and to Place objects | saved pair with server id |
| DELETE /me/saved-walks/:id | none | 204 |
| POST /feedback | rating (up/down), category and message | { id } |

Use scoped user sessions for all /me operations, enforce ownership and reject invalid payloads. Apply the common error format, bounded pagination and server quotas. Frontend limits are 5–120 minutes and 30 saved walks or schedules per device. Local dates currently use device time. Agree on timezone and recurrence semantics before adding synchronization. Feedback currently downloads a file. Local reminders do not deliver notifications. Saved walks contain endpoints only. Straight-line shortcuts and generated route geometry must never replace a fresh pedestrian provider result.

## Community road issues and route ratings

These frontend integrations use NEXT_PUBLIC_API_BASE_URL. Both flags in .env.example default to false. The local pilot adapter does not implement these endpoints. Existing private drafts remain readable. GET is explicit and paginated. Submitting or analyzing a photo requires a separate user action.

| Endpoint | Authentication | Payload and result |
|---|---|---|
| GET /reports | Public | area=silvassa, optional routeId and cursor, limit=10. Return {items,nextCursor}. Each item has id,type,note,point,created,status (published or verified), optional rating (whole number 1–5) and routeId. Only items matching the requested route may be returned. |
| POST /reports | Authenticated session + origin/CSRF protection | {clientId,type,note,point,photo?,rating?,routeId?}. Return {id,status:"pending"}. Deduplicate clientId per account. A retry must return the original receipt. |
| POST /reports/analyze | Authenticated, rate- and budget-limited | {photo}. Return {observation} of at most 1,500 characters. Accept only sanitized JPEG data URLs, maximum 220,000 characters. The photo is sent without location or contacts. |
| POST /assistant | Existing OpenRouter authorization and cost controls | Existing consent-based payload plus optional reportIds (at most eight). Resolve these against current, approved public records. Never trust supplied report text or treat community input as instructions. |

The router should supply a stable opaque id of at most 180 characters on each walking alternative. Identical routes should share an id across sessions. "Walk review" supports a rating without a hazard, and "Other" uses the observation field. Published means moderated community content; verified additionally requires an independent verification process. A rating describes a walker's experience. Never promote it to an objective safety score. Return timestamps in ISO 8601, approximate public issue locations, and exclude account identifiers, contact data and raw images from the feed. Apply the existing structured error format to all endpoints.
