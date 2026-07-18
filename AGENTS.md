# MVP Implementation Plan

## Phases

- [x] **Phase 1: Project Setup & Auth** - Initialize project, setup database schema (User, Movie, WatchedEntry), and implement Authentication (Email/Google).
- [x] **Phase 2: Movie Discovery & Logging** - Implement TMDb API integration for searching movies and the ability for users to add movies to their "Watched List" with personal ratings. _(Implemented using OMDb API instead of TMDb)_
- [x] **Phase 3: Taste Score Engine (v0)** - Implement the backend logic to compute the initial Taste Score (Diversity + Obscurity + Consistency).
- [x] **Phase 4: Public Profile & Display** - Build the public profile page that displays the user's Watched List, their Taste Score, and a breakdown of the score.
- [x] **Phase 5: Verdict System (Core Mechanic)** - Implement the ability for users to leave a "Verdict" (rating + short comment) on another user's profile.
- [x] **Phase 6: Social Layer (Feed & Follow)** - Implement the follow system and a basic feed showing recent verdicts.
- [ ] **Phase 7: Shareability (Growth Engine)** - Create the shareable image card generator for profiles and taste scores.
- [ ] **Phase 8: UI/UX Polish & PWA** - Refine the overall design, add animations, and ensure a high-quality PWA experience.
- [ ] **Phase 9: Testing & Deployment** - Comprehensive testing, bug fixing, and deploying the MVP to production.

## Infrastructure

### Database

- **Current:** Local SQLite (`data/sqlite.db`) via better-sqlite3 + Drizzle ORM
- **Safety:** Database lives in `data/` (`.gitignore`d) — never tracked by git. Auto-backup on `dev`, `db:seed`, and `db:push`. Override path via `DB_PATH` env var.
- **Cloud Setup (TODO):** Migrate to a cloud database (Supabase, Turso, or Neon) — update `src/db/index.ts` to point to the remote connection string and run Drizzle migrations on deploy.

## Current Progress

- [x] Phase 1: Project Setup & Auth (Completed)
- [x] Phase 2: Movie Discovery & Logging (Completed)
- [x] Phase 3: Taste Score Engine (v0) (Completed)
- [x] Phase 4: Public Profile & Display (Completed)
- [x] Phase 5: Verdict System (Core Mechanic) (Completed)
- [x] Phase 6: Social Layer (Feed & Follow) (Completed)
