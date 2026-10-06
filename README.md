# Venue Seek

Find performance venues for solo classical guitarists in the USA using Google Places.

## Setup

1. In Google Cloud, enable **Places API (New)** and **Maps JavaScript API**.
2. Create two API keys:
   - Server key (Places API only, no referrer restriction) → `GOOGLE_MAPS_API_KEY`
   - Browser key (Maps JavaScript API, restricted by HTTP referrer) → `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`
3. `cp .env.example .env.local` and fill in the keys.
4. `npm install && npm run dev`, then open http://localhost:3000.

## Scripts

```bash
npm run dev        # dev server
npm run test:run   # unit tests (Vitest)
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

## How it works

- `GET /api/locations/autocomplete` powers the location typeahead (Places Autocomplete, US regions only).
  Picking a suggestion sends its `placeId` + session token with the search, so the autocomplete session
  closes with a single Place Details lookup. Free text still works via Text Search.
- `POST /api/venues/search` resolves the location, runs one Text Search per selected venue type,
  merges duplicates, drops closed/out-of-radius places and ranks by a rule-based fit score
  ([src/lib/venues/scoring.ts](src/lib/venues/scoring.ts)).
- `GET /api/venues/[placeId]/summary` fetches Google's editorial, AI and review summaries on demand
  (these are billed at the higher Atmosphere SKU, so they're not part of search).
- Venue types and weights live in [src/lib/venues/categories.ts](src/lib/venues/categories.ts).
