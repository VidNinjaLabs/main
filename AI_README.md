# VidNinja Developer Brain / AI Context

> **Purpose**: This file provides a high-level "brain" and deep context for AI agents (and human developers) to understand the architecture, flows, and conventions of the VidNinja codebase.

## 1. Project Overview

**VidNinja** is a modern media streaming web application built with **React** and **Vite**. It functions as a frontend for discovering movies/TV shows and streaming them from various providers (VidNinja Backend, Febbox).

- **Stack**: React (v18), TypeScript, Vite (v5), TailwindCSS.
- **State Management**: Zustand.
- **Routing**: React Router DOM (v6).
- **PWA**: Fully supported via `vite-plugin-pwa`.
- **Localization**: i18next.

## 2. Architecture & Key Components

The application is structured as a client-side SPA that interacts with specific backend APIs for metadata and media sources.

### Core Modules

- **Frontend (`src/`)**:
  - **`setup/`**: Initialization logic (`App.tsx`, `config.ts`, `pwa.ts`). Entry point `index.tsx` imports these.
  - **`pages/`**: Route components. Key pages include `PlayerView` (media playback), `Browse`, `Discover`, `settings`.
  - **`components/`**: Reusable UI atoms and molecules.
  - **`stores/`**: Global state managed by **Zustand**.
    - `auth`: User authentication and backend URL state.
    - `progress`: Tracks watched media position.
    - `bookmarks`: User saved content.
    - `theme`: UI theming.
  - **`backend/`**: pseudo-backend logic running in the browser.
    - **`providers/`**: Logic for fetching streams (@vidninja/providers).
    - **`api/`**: Clients for external APIs (`vidninja`, `febbox`). `init.ts` bootstraps these.

### Data Flow

1.  **App Starts** (`index.tsx`):
    - Initializes Global Styles, Analytics, PWA.
    - Calls `initializeVidNinja()` and `initializeFebbox()` from `src/backend/api/init.ts` to setup API clients.
    - Renders `Introduction/App` hierarchy.
2.  **Navigation**: `App.tsx` handles routing.
    - `/media/:media`: Loads `PlayerView`.
    - `/browse`: Loads `BrowsePage`.
3.  **State**:
    - Persistent state (auth, progress) is synced via specific synced stores (e.g., `ProgressSyncer`).
    - API responses are generally handled via hooks (`useAsync` from `react-use` is common) or internal query helpers.

## 3. Directory Structure (Annotated)

```text
w:\cloudclash\frontend\
├── .env                  # Environment variables (Critcial!)
├── package.json          # Dependencies & Scripts
├── vite.config.mts       # Build config (defines aliases, PWA, plugins)
├── public/               # Static assets
└── src/
    ├── assets/           # CSS, images
    ├── backend/          # Logic for APIs, Providers, Extension messaging
    │   ├── api/          # VidNinja & Febbox API clients
    │   ├── providers/    # Stream provider logic
    │   └── metadata/     # TMDB integration & meta helpers
    ├── components/       # UI Components
    ├── contexts/         # React Contexts (e.g., AuthContext)
    ├── hooks/            # Custom React Hooks (auth, keyboard, etc.)
    ├── pages/            # Application Views (Routes)
    ├── setup/            # App initialization & Config
    ├── stores/           # Zustand State Stores
    ├── themes/           # Theme definitions
    ├── utils/            # Shared utilities
    └── index.tsx         # Entry point
```

## 4. Key Configurations & Environment

The app relies heavily on `.env` variables. Key variables include:

- `VITE_VIDNINJA_API_URL`: The URL for the main backend (proxy/metadata).
- `FEBBOX_API_URL`: Secondary provider API.
- `FEBBOX_UI_TOKEN`: Token for Febbox UI operations.
- `VITE_APP_DOMAIN`: The domain the app is anticipated to run on.
- `VITE_PWA_ENABLED`: Toggle PWA generation.

**Configuration File**: `src/setup/config.ts` (implied) abstracts some of this access. `vite.config.mts` sets aliases like `@` for `src` and `@vidninja/providers`.

## 5. Main Workflows

### Initialization
`src/index.tsx` is the bootstrapper. It mounts the React root along with `HelmetProvider`, `Suspense`, and various `Syncer` components (`ProgressSyncer`, `BookmarkSyncer`) that listen to state changes and persist them (likely to local storage or backend if auth).

### Media Playback
The `PlayerView` component (`src/pages/PlayerView`) is the heart of the streaming experience. It likely:
1.  Reads the `media` ID from the URL.
2.  Fetches metadata using `src/backend/metadata`.
3.  Invokes provider logic in `src/backend/providers` to find a stream.
4.  Renders a video player (custom or `vidply` integration as seen in deps).

### Providers
The `src/backend/providers` directory handles the logic of finding "sources" for a given media ID. It appears to split into `providers.ts` and `fetchers.ts`.

## 6. Development Tips

- **Run Dev Server**: `pnpm dev` (Runs Vite).
- **Build**: `pnpm build` (Outputs to `dist/`).
- **Lint**: `pnpm lint`.
- **Legacy URLs**: The app supports legacy URL conversion (middleware in `App.tsx` -> `LegacyUrlView`).
- **Ad Support**: `App.tsx` contains conditional logic for `AdMaven`, `Adsterra`, `PopAds` based on `isAdmin/isPremium` flags.

## 7. Known Context / Quirks

- **"CloudClash" Context**: This specific workspace is named `cloudclash`, but the project internally identifies as `VidNinja` (v5.3.0).
- **Turnstile**: Integration present (`TurnstileGate` in `App.tsx`).
- **Mixed Routing**: Supports both Hash and Browser history router via `VITE_NORMAL_ROUTER` env var (see `TheRouter` in `index.tsx`).
- **Extensions**: Has logic to check for a browser extension (`ExtensionStatus` in `index.tsx`) to potentially bypass CORS or blocking issues.
