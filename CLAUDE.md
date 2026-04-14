# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (proxies /api → http://localhost:3000)
npm run build        # Type-check + build for production
npm run type-check   # Run vue-tsc type checking only
npm run test:unit    # Run all Vitest unit tests
npm run test:e2e     # Run Playwright end-to-end tests
npm run format       # Format source files with oxfmt
```

Run a single test file:
```bash
npx vitest run src/views/__tests__/Login.spec.ts
```

Run tests matching a description pattern:
```bash
npx vitest run --reporter=verbose -t "shows unregistered"
```

## Architecture

**Stack:** Vue 3 (Composition API + `<script setup>`), Vue Router 5, Pinia, Element Plus, Axios, Vite, TypeScript, Vitest.

**Layer separation:**
- `src/service/` — raw API calls via the shared `http` client (`http.ts`). Each file exports typed request functions and response interfaces (e.g. `auth.ts`, `city.ts`).
- `src/store/` — Pinia stores that own reactive state. Stores call service functions and also sync to/from `localStorage` via a `syncFromStorage()` action called once on startup in `main.ts`.
- `src/views/` — page-level components mapped 1:1 with routes.
- `src/components/` — reusable sub-components, grouped by feature (`weather/`, `List/`).
- `src/layout/` — app shell components (`AppLayout.vue`, `AppTopNav.vue`, `CyberCursorOverlay.vue`).

**HTTP client (`src/service/http.ts`):**
- Base URL is `/api` (dev-proxied to `localhost:3000`).
- Request interceptor injects `Authorization: Bearer <token>` from `authStore` (or localStorage fallback for SSR-safe calls).
- Response interceptor unwraps `response.data`, and on 401 clears auth state and redirects to `/login?reason=expired&redirect=<current-path>`.

**Auth flow:**
- `authStore` (`src/store/auth.ts`) is the source of truth. Token + user profile are persisted in `localStorage` under `auth_token` / `auth_user`.
- Route guard in `src/router/index.ts` reads localStorage directly (avoids Pinia before it's ready) and redirects to `/login?reason=unauthorized&redirect=<path>` for routes with `meta.requiresAuth: true`.
- Currently only `/login-list` requires auth.

**Route `meta.navVariant`** controls which navigation style the layout renders: `'start'` (landing/auth pages) or `'home'` (main app pages).

**City detail routing (nested):** `/weather/:cityName` maps to `CityDetail.vue` (layout shell) with two child routes:
- `''` → `CityOverviewView.vue` (named `city-detail`) — weather overview with city tabs
- `temperature-trend` → `TemperatureTrendView.vue` (named `city-temperature-trend`)

`CityDetail.vue` loads city data and passes it to `WeatherPageShell.vue`; the child views read `route.params.cityName` and call `cityStore.ensureCitiesLoaded()` independently. Navigation between cities uses `router.push({ name: 'city-detail', params: { cityName } })`. The `/weather` route redirects to the first city in `localStorage` via `resolveWeatherEntryRoute()`.

**City backgrounds & weather overlays:**
- `src/utils/cityBackgrounds.ts` — eagerly imports all `src/assets/cities/*.{png,jpg,webp}` at build time. File names must follow the pattern `城市名（昼|昏|夜）.ext` to be parsed. `resolveCityBackground(cityName)` returns the correct image URL for the current time of day (day: 07:00–18:00, dusk: 05:00–07:00 & 18:00–20:00, night: otherwise).
- `src/utils/weatherOverlays.ts` — maps Chinese weather text (e.g. `晴`, `阵雨`, `雷阵雨`) to overlay kinds. Showers and thunder-showers cycle between rain and sunny phases on a 10-second period; lightning flashes fire at fixed time windows within the rain phase.
- Both utilities are consumed by `WeatherPageShell.vue`, which renders the dynamic background image + CSS particle effects (rain drops / snowflakes).

**`cityStore` localStorage key** is `city_list`. On startup, `syncFromStorage()` strips legacy default city data (hardcoded sentinel check). The first element of the cities array is treated as the default city throughout the app.

**`authStore` dispatches `auth-user-updated` DOM events** on `setAuth`, `clearAuth`, and `updateUserProfile` so that non-reactive code (e.g. `AppTopNav`) can respond to auth changes without direct store coupling.

**Testing patterns:**
- Unit tests use `@vue/test-utils` with `mount()` + Element Plus component stubs.
- `vue-router` and service modules are fully mocked with `vi.mock()`.
- `vi.hoisted()` is used for mocks that must be hoisted before module evaluation (router, ElMessage, etc.).
- Tests are colocated in `__tests__/` directories next to the code they test.
