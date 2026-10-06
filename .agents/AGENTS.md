# Workspace & Agent Instructions — Brite Sight

> Canonical instructions for AI coding agents (Copilot, Antigravity, Cursor, etc.)

## Workspace Rules & Issue Tracking

**IMPORTANT**: Before starting any work, run the `beans prime` command and heed its output.
- **Issue Tracking**: Use `beans` CLI to track **only new features or major refactorings**. Do NOT create or use beans for small fixes, minor tweaks, or routine code changes.
- **Git Commits**: Do not automatically commit changes. Let the user run git commands.
- **Code Style**: Prefer clean components and hooks.
- **Verification**: Do not open, drive, or manually verify behavior in a browser unless the user explicitly asks. Validate changes with non-browser methods: unit tests, linting, type checks, static analysis, logs, and code inspection.

---

## Commands

```bash
npm run dev          # Vite dev server (frontend only, port 3000)
npm run dev:full     # Netlify dev (frontend + functions, port 8888)
npm run build        # Production build
npm run test:run     # Run vitest tests
npx tsc --noEmit     # Type-check
npm run fix:exercise <id> # Clean up ties/slurs for an exercise in Supabase DB
npm run rename:exercise <id> "<title>" # Update title for an exercise in Supabase DB
```

---

## Hard Rules

1. **`Grade` is `1|2|3|4|5|6|7|8`** — never use plain `number`. Defined in `types/index.ts`.
2. **Never import `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` in frontend code.** They exist only in `netlify/functions/`.
3. **Never call Supabase directly from components.** All DB access goes through `services/exerciseApi.ts` → `/.netlify/functions/...`.
4. **Route ordering matters.** In `index.tsx`, `/exercise/generate` must precede `/exercise/:id` or the static path gets swallowed.
5. **Use `export type` for type-only exports.** TypeScript strict mode is on.
6. **`constants/gradeRules.ts` is the single source of truth** for note ranges, rhythms, techniques, and weights per grade. Changes to difficulty start there.

---

## Sensitive Components & Known Gotchas

| File / Area | Context & Guidance |
|-------------|--------------------|
| `services/audioPlaybackService.ts` | **Check data before refactoring**: If a generated exercise fails to play, it is typically invalid MusicXML data from Gemini, not a parser bug. Verify data payload before changing querySelector/parsing logic. |
| `components/ScoreDisplay.tsx` OSMD init | **CDN load sequence**: OSMD is loaded dynamically via CDN (`cdn.jsdelivr.net`). Preserve initialization order and container lifecycle during refactors. |

---

## Architecture (Quick Reference)

| Layer | Location | Notes |
|-------|----------|-------|
| Entry point / Routes | `index.tsx` | All routes defined here |
| Components | `components/` | Modals use `isOpen` + `onClose` props (ref: `AuthModal.tsx`) |
| Auth state | `contexts/AuthContext.tsx` | Wraps entire app |
| Server state | `hooks/useExercises.ts` | TanStack Query v5, query key factory, 5–10 min staleTime |
| Client prefs | `localStorage` | Grade, metronome, bookmarks, guest count |
| API layer | `services/exerciseApi.ts` | Only frontend→backend bridge |
| AI pipeline | `services/musicSpecBuilder.ts` → `geminiPrompts.ts` → `musicComposer.ts` → `geminiService.ts` | Configured via `config/geminiConfig.ts`; runs server-side in `generate-exercise-background` function |
| Validation | `services/gradeValidation.ts`, `xmlValidator.ts`, `xmlNormalization.ts` | Pitch range + XML structure |
| Backend | `netlify/functions/` | save, get, generate, sweep-stale-jobs |
| Dark mode | `services/themeService.ts` | Tailwind `class` strategy, use `dark:` variants |
| Guest limits | `services/guestTracking.ts` | 10 exercises cap; migration on signup via `userMigration.ts` |
| Issue Tracker | `.beans/`, `beans` CLI | Agent issue tracking system |

---

## Environment Variables

| Variable | Scope | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | Frontend | `import.meta.env` |
| `VITE_SUPABASE_ANON_KEY` | Frontend | `import.meta.env` |
| `SUPABASE_URL` | Functions only | Server-side |
| `SUPABASE_SERVICE_ROLE_KEY` | Functions only | **Never expose** |
| `GEMINI_API_KEY` | Functions only | **Never expose** |

---

## Patterns to Follow

- **State**: No Redux/Zustand. Auth context + TanStack Query + localStorage only.
- **Modals**: `isOpen: boolean`, `onClose: () => void`. Copy `AuthModal.tsx`.
- **Weighted selection**: Key/texture/time signature weights in `gradeRules.ts` use 1–10 range.
- **CORS**: Managed in `netlify/functions/utils/cors.ts`. Currently `*`.
- **Security headers**: CSP, HSTS, X-Frame-Options in `netlify.toml`.
- **OSMD**: Loaded via CDN (`cdn.jsdelivr.net`), not npm. Chunk size warning in Vite is expected.

---

## Common Mistakes

- **Fixing symptoms instead of root causes**: Adding ad-hoc post-processing regex fixes or normalization hacks for generation artifacts → refine `geminiPrompts.ts`, prompt spec builder, or fix database records directly instead.
- Changing `audioPlaybackService.ts` because one exercise doesn't play → it's a data issue
- Using `number` instead of the `Grade` union type
- Importing service-role key in frontend code
- Adding state management libraries (no Redux/Zustand — use what's there)
- Calling Supabase client directly from a component instead of through exerciseApi
