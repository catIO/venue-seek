<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Venue Seek — Agent Instructions

Web app that helps solo classical guitarists find US performance venues via Google Places API (New).

## Workspace rules

- **Git:** Do not commit or push. Let the user run git commands.
- **Issue tracking:** If a `.beans/` tracker exists, run `beans prime` first and track only new features or major refactors there.
- **Verification:** Don't open or drive a browser unless asked. Verify with unit tests, type checks, lint, and build.
- **Tests:** Every behavior change ships with unit tests.

## Commands

```bash
npm run dev        # Next.js dev server (port 3000)
npm run test:run   # Vitest
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
npm run build      # Production build
```

## Hard rules

1. **`GOOGLE_MAPS_API_KEY` is server-only.** Use it only in `src/lib/places/client.ts`, which imports `server-only`. Never prefix it with `NEXT_PUBLIC_`.
2. **All Google Places calls go through `src/lib/places/client.ts`.** Components call only the app's `/api/...` routes.
3. **Validate every API route input with zod** schemas in `src/lib/venues/searchSchema.ts`.
4. **Keep field masks minimal.** Each field changes the billing SKU. Atmosphere fields (summaries, `liveMusic`, reviews) belong in the on-demand Place Details call, never in search.
5. **Render third-party URLs through `safeExternalUrl()`**, using `rel="noopener noreferrer"` on external links.
6. **Use `export type` for type-only exports.** TypeScript strict mode is on.

## Architecture

| Layer | Location | Notes |
|-------|----------|-------|
| Page | `src/app/page.tsx` | Client page: search form, results list, map |
| API routes | `src/app/api/` | `venues/search`, `venues/[placeId]/summary`, `locations/autocomplete` |
| Places client | `src/lib/places/client.ts` | Text Search, Autocomplete, Place Details; `PlacesApiError` |
| Search orchestration | `src/lib/places/searchVenues.ts` | One Text Search per category; merge, filter, score |
| Domain | `src/lib/venues/` | Categories and weights, scoring, size estimate, geo, schemas |
| UI | `src/components/` | Material 3 components; icons in `Icon.tsx` |
| Theme | `src/app/globals.css` | M3 color, type, shape, elevation, and state-layer tokens |

## Patterns

- **Categories:** `src/lib/venues/categories.ts` is the single source of truth for venue types, search queries, weights, and `requiresPerformanceSpace`.
- **Venue size:** A heuristic from Google types, name, and category (`size.ts`); Google has no capacity data. Filtering happens client-side, with no extra API calls.
- **Autocomplete billing:** Send the session token with autocomplete and the final Place Details call. Rotate it after each search.
- **Styling:** Use M3 token classes (`bg-surface-container-low`, `text-on-surface-variant`, `type-title-medium`, `state-layer`), not raw Tailwind palette colors. Regenerate colors with `@material/material-color-utilities` if the seed changes.
- **State:** No global state library. Use local state plus the `useVenueSearch` hook.

## Testing gotchas

- Vitest 5 runs on Vite 8 (rolldown). If you see "Cannot find native binding", delete `node_modules` and `package-lock.json`, then reinstall.
- `server-only` is aliased to its empty module in `vitest.config.mts`.
- Server tests need the `// @vitest-environment node` pragma.

## Environment variables

| Variable | Scope | Notes |
|----------|-------|-------|
| `GOOGLE_MAPS_API_KEY` | Server | Places API (New) only. No referrer restriction; use IP restriction in prod |
| `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` | Browser | Maps JavaScript API only, referrer-restricted. Map hides if unset |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Browser | Optional; defaults to `DEMO_MAP_ID` |
