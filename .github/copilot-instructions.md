# Copilot Instructions for weather-frontend

This guide helps future Copilot sessions work effectively in this repository.

## Build, Test & Lint Commands

**Development & Build:**
```bash
npm run dev            # Start dev server (proxies /api → http://localhost:3000)
npm run build          # Type-check + build for production
npm run type-check     # Run TypeScript type-checking only
npm run format         # Format with oxfmt
```

**Testing:**
```bash
npm run test:unit      # Run all Vitest unit tests
npm run test:e2e       # Run Playwright end-to-end tests

# Run a single test file:
npx vitest run src/views/__tests__/Login.spec.ts

# Run tests matching a description pattern:
npx vitest run --reporter=verbose -t "shows unregistered"

# Run E2E tests in UI mode (helps debugging):
npx playwright test --ui
```

## Project Stack

- **Frontend Framework:** Vue 3 (Composition API + `<script setup>`)
- **State Management:** Pinia
- **Routing:** Vue Router 5
- **UI Components:** Element Plus
- **HTTP Client:** Axios (with interceptors)
- **Build Tool:** Vite (beta)
- **Type Safety:** TypeScript 5.9.3
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Visualization:** ECharts, Leaflet, Mars2D
- **Code Formatting:** oxfmt

**Node Requirements:** `^20.19.0` or `>=22.12.0`

## Architecture Overview

### Layer Separation

The codebase follows a clear layered architecture:

- **`src/service/`** — Raw API calls via shared `http` client (`http.ts`). Each file exports typed request functions and response interfaces (e.g., `auth.ts`, `city.ts`, `weather.ts`).
- **`src/store/`** — Pinia stores own reactive state. Stores call service functions and sync to/from `localStorage` via `syncFromStorage()` (called once at startup in `main.ts`).
- **`src/views/`** — Page-level components mapped 1:1 with routes.
- **`src/components/`** — Reusable sub-components, grouped by feature (`weather/`, `city-list/`, etc.).
- **`src/layout/`** — App shell components (`AppLayout.vue`, `AppTopNav.vue`, `CyberCursorOverlay.vue`).
- **`src/utils/`** — Utility functions and helpers (weather overlays, city backgrounds, etc.).
- **`src/composables/`** — Vue Composition API composables for shared logic.

### Key Technical Patterns

**HTTP Client & Auth (`src/service/http.ts`):**
- Base URL is `/api` (dev-proxied to `http://localhost:3000`)
- Request interceptor injects `Authorization: Bearer <token>` from `authStore` (with localStorage fallback for SSR-safe calls)
- Response interceptor unwraps `response.data` and on 401 clears auth state, redirecting to `/login?reason=expired&redirect=<current-path>`

**Authentication Flow:**
- `authStore` (`src/store/auth.ts`) is the source of truth
- Token + user profile persisted in `localStorage` under `auth_token` / `auth_user` keys
- Route guard in `src/router/index.ts` reads localStorage directly (avoids Pinia before it's ready)
- Routes with `meta.requiresAuth: true` redirect to `/login?reason=unauthorized&redirect=<path>` (currently only `/login-list`)
- Auth state changes dispatch `auth-user-updated` DOM events for non-reactive code to listen to

**City Management:**
- `cityStore` localStorage key is `city_list`
- First city in the array is the default city throughout the app
- Startup clears legacy default city data via hardcoded sentinel check in `syncFromStorage()`

**Routing & Navigation:**
- Route `meta.navVariant` controls navigation style: `'start'` (landing/auth pages) or `'home'` (main app)
- City detail routing (nested): `/weather/:cityName` → `CityDetail.vue` (shell) with child routes:
  - `''` → `CityOverviewView.vue` (named `city-detail`)
  - `temperature-trend` → `TemperatureTrendView.vue` (named `city-temperature-trend`)
- Navigate between cities using: `router.push({ name: 'city-detail', params: { cityName } })`
- `/weather` route redirects to first city via `resolveWeatherEntryRoute()`

**Weather Backgrounds & Overlays:**
- `src/utils/weather/cityBackgrounds.ts` — Eagerly imports city background images from `src/assets/cities/`
  - File names must follow pattern: `城市名（昼|昏|夜）.ext` (e.g., `北京（昼）.png`)
  - `resolveCityBackground(cityName)` returns correct image URL for current time (day: 07:00–18:00, dusk: 05:00–07:00 & 18:00–20:00, night: otherwise)
- `src/utils/weather/weatherOverlays.ts` — Maps Chinese weather conditions to overlay types
  - Showers/thunderstorms cycle rain/sunny phases on 10-second period
  - Lightning flashes at fixed time windows during rain phase
- Both consumed by `WeatherPageShell.vue` for dynamic background + CSS particle effects

## Testing Patterns

- **Unit tests** use `@vue/test-utils` with `mount()` + Element Plus component stubs
- **Module mocks** use `vi.mock()` with full path resolution (e.g., `@/service/auth`)
- **Hoisted mocks** use `vi.hoisted()` for mocks that must be evaluated before module import (router, ElMessage, store actions, etc.)
- **Tests are colocated** in `__tests__/` directories next to the code they test
- **Test structure:** describe → mocks setup (vi.hoisted) → vi.mock() → test definitions

## Key Conventions

1. **Store events for non-reactive listeners** — `authStore` dispatches `auth-user-updated` events on `setAuth`, `clearAuth`, `updateUserProfile`
2. **Component organization** — Group related components in feature subdirectories (e.g., `weather/overview/`, `weather/map/`)
3. **Service interfaces** — Export both request functions and response/request types from service files
4. **Path aliases** — Use `@/` for `src/` imports (configured in `vite.config.ts`)
5. **localStorage persistence** — Stores call `syncFromStorage()` at app startup; manual save to localStorage is handled by store actions
6. **Async routing** — City data is loaded independently in views via `cityStore.ensureCitiesLoaded()`; don't duplicate loading logic

## TypeScript Config

- **Workspace config**: `tsconfig.json` references node, app, and vitest configs
- **App config**: `tsconfig.app.json` with strict mode enabled
- **Vitest config**: `tsconfig.vitest.json` for test files

## Additional Resources

- See **CLAUDE.md** in the repository root for deeper architectural details and implementation notes
- API documentation can be generated with `npm run docs:api` (TypeDoc)
