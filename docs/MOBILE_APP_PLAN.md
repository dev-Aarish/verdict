# Verdict Mobile App - Implementation Plan

This document outlines the step-by-step implementation plan for migrating the Verdict platform to a native mobile application using **React Native** and **Expo**. 

## Tech Stack
- **Framework:** React Native with Expo (Managed Workflow)
- **Navigation:** Expo Router (File-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Data Fetching:** TanStack Query (React Query) + Axios
- **State/Storage:** Expo SecureStore (for Auth tokens)
- **Backend:** Existing Express.js API (No backend changes required)

---

## Phase 1: Project Scaffolding & Configuration
- [x] Initialize a new Expo project (`mobile/` directory) using the Expo Router template.
- [x] Setup UI theme, layout foundations, and styling constants.
- [x] Setup absolute imports and project structure (`components/`, `context/`, `api/`, `constants/`, `types/`).
- [x] Configure environment variables & base URL handling (for iOS simulator, Android emulator, and physical devices).
- [x] Setup **TanStack Query** provider for API state management.

## Phase 2: Authentication System
- [x] **Auth Context:** Create a React Context to manage user session state.
- [x] **Token Storage:** Implement `expo-secure-store` to safely save session tokens.
- [x] **Screens:** Build Login (with one-click demo login buttons for Alice & Bob) and Signup screens.
- [x] **API Interceptors:** Configure Axios to automatically attach auth Bearer tokens to outbound backend requests.

## Phase 3: Core Navigation & Layout
- [x] Setup **Bottom Tab Navigation**:
  - 🏠 **Feed** (Home Activity & Leaderboards)
  - 🔍 **Search** (Movie Discovery & Trending)
  - 🔖 **Watchlist** (Queued films)
  - 👤 **Profile** (Personal taste score, watched list & verdicts)
- [x] Setup **Stack Navigation** for nested screens (`movie/[id]`, `user/[username]`, `auth/login`, `auth/signup`).
- [x] Build global UI components (`Button`, `Input`, `Avatar`, `Badge`, `Card`, `TasteScoreGauge`, `MovieCard`, `VerdictCard`).

## Phase 4: Movie Discovery & Logging (The Core Loop)
- [x] **Search Screen:** Build a responsive live search bar querying backend OMDb route with debouncing and trending list.
- [x] **Movie Detail Screen:** Display high-res poster, synopsis, cast, director, runtime, IMDb rating, and box office.
- [x] **Logging Interface:** Interactive rating modal with haptic feedback to rate films (1-100) and log notes.

## Phase 5: Profiles & Taste Score
- [x] **My Profile:** Build the user profile screen showing their generated Taste Score (Diversity + Obscurity + Consistency + Dominant Genres).
- [x] **Watched List:** Segmented list showing personal film ratings.
- [x] **Public Profiles:** Public profile route with Taste Compatibility matching, watched history, and follow state.

## Phase 6: Social Layer (Feed & Interactions)
- [x] **Activity Feed:** Feed stream showing recent verdicts, critiques, and community leaderboard.
- [x] **Verdict System:** Interactive `LeaveVerdictModal` to judge friends' taste profiles with 1-5 star ratings and reviews.
- [x] **Follow System:** Follow/Unfollow toggle on public user profiles.
- [x] **Pull to Refresh:** Native `RefreshControl` across feed, watchlist, and profile.

## Phase 7: Native Polish & Growth Engine
- [x] **Haptics & Feedback:** Integrated `expo-haptics` across button clicks, rating presets, and stars.
- [x] **Shareable Cards:** `ShareCardModal` using `react-native-view-shot` to snapshot high-res Taste Cards and `expo-sharing` to trigger the native iOS/Android share sheet.
- [x] **App Config:** Configured dark theme, deep link scheme (`verdict`), bundle identifiers, and plugins in `app.json`.

---

## Deployment Strategy
- **Testing:** Use Expo Go or Development Builds to test on physical devices.
- **OTA Updates:** Setup Expo EAS Update for over-the-air bug fixes without app store reviews.
- **App Store & Play Store:** Use Expo EAS Build to generate `.ipa` and `.aab` production binaries.
