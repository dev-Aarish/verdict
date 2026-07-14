# Future Improvements & Missing Implementations

## Critical Issues

### 1. Auth: Password is a facade

- **File:** `src/api/auth.ts`, `src/routes/login.tsx`, `src/routes/signup.tsx`
- Passwords are collected on signup/login forms but **never stored or validated**. Login works by providing just an email.
- **Fix:** Hash passwords with bcrypt/argon2 on signup, verify on login.

### 3. Verdict System: Backend not wired up

- **File:** `src/routes/verdict.$username.tsx`
- The UI page exists at `/verdict/:username` but the "Stamp it" button only does local state manipulation. No server function saves to the `verdicts` table.
- **Fix:** Create server functions in `src/api/verdicts.ts` for creating and fetching verdicts.

### 4. Taste Score Engine (Phase 3): Completely absent

- **File:** `src/db/schema.ts` (table exists)
- The `tasteScores` table exists but there is zero computation logic anywhere in the codebase.
- **Fix:** Implement diversity + obscurity scoring algorithm.

### 5. Feed uses hardcoded mock data

- **File:** `src/lib/mock.ts`, `src/routes/feed.tsx`
- `globalFeed` and `leaderboard` are static arrays. No server function fetches real verdicts from the database.
- **Fix:** Create server functions to query real verdict and follow data.

### 6. Share card uses mock data

- **File:** `src/routes/share.$username.tsx`, `src/lib/mock.ts`
- The share card shows a static taste score of 87 and fake films.
- **Fix:** Wire up real user data, watched list, and computed taste score.

### 7. Follow system is schema-only

- **File:** `src/db/schema.ts` (`follows` table)
- No server functions or UI for following/unfollowing users.
- **Fix:** Create server functions and UI components for the follow system.

### 8. Profile page missing data

- **File:** `src/routes/profile.$username.tsx`
- Does not show: Taste Score, verdicts from others, or a taste score breakdown.
- **Fix:** Integrate taste score display and verdict list.

### 9. No PWA setup

- No `manifest.json`, no service worker, despite PWA being in the plan.
- **Fix:** Add PWA manifest, service worker, and offline support.

### 10. Movie enrichment on every add

- **File:** `src/api/movies.ts`
- Movie metadata is fetched from OMDb every time a movie is added (enrichment call).
- **Fix:** Cache movie data locally and only fetch if not already present.

### 11. No pagination on profile watched list

- **File:** `src/routes/profile.$username.tsx`
- Loads all watched entries at once — will degrade with many entries.
- **Fix:** Add pagination or infinite scroll to the watched list.
