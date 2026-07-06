# Hajj Proximity

A React Native app that helps pilgrims track their approach to the Meeqat boundaries and the Haram of Makkah.

## Features

- **Meeqat map** — live map showing all 5 Ihram stations with colour-coded sector arcs, your position, and the nearest Meeqat with distance
- **Haram boundary** — dedicated map tab with the Sacred Mosque boundary polygon and inside/outside status
- **Proximity alerts** — background location tracking sends a local notification when you approach a Meeqat (configurable threshold: 10 / 20 / 50 km) or cross into/out of the Haram
- **Ihram checklist** — 7-item pre-Ihram checklist persisted locally; completion banner when ready
- **Offline-first** — all Meeqat coordinates and the Haram boundary polygon are bundled in the app, no network required

## Stack

| Layer | Technology |
|---|---|
| Framework | Expo (React Native) |
| Language | TypeScript |
| Maps | react-native-maps + Google Maps SDK (Android) |
| Location | expo-location (foreground + background) |
| Notifications | expo-notifications (local only) |
| Storage | @react-native-async-storage/async-storage |
| Build | EAS Build |
| Tests | Jest (jest-expo preset) |
| CI | GitHub Actions |

## Getting started

### Prerequisites

- Node 22+
- [EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`
- Android device or emulator

### Local development

```bash
npm install
npm start   # starts Metro bundler
```

A development build is required (the app uses native modules). Install one via:

```bash
eas build --profile development --platform android
```

Then scan the QR code from Metro.

### Running tests

```bash
npm test
```

### Building a preview APK

```bash
eas build --profile preview --platform android
```

The APK link appears in the EAS dashboard when the build completes (~15 min).

## Environment

The Google Maps API key is stored as an EAS secret (`GOOGLE_MAPS_API_KEY`) and is never committed to the repository. To set it:

```bash
eas env:create --variable-name GOOGLE_MAPS_API_KEY --value YOUR_KEY --environment production --visibility secret
```

### Crash reporting (Sentry)

Crash reporting is wired up via `@sentry/react-native` but disabled until a DSN is set — `Sentry.init()` is a no-op without one. To enable it:

1. Create a free project at [sentry.io](https://sentry.io)
2. Set the DSN as an EAS env var (safe to be non-secret — Sentry DSNs are public identifiers by design):
   ```bash
   eas env:create --variable-name EXPO_PUBLIC_SENTRY_DSN --value YOUR_DSN --environment production
   ```
3. For source map uploads on build, also set `SENTRY_ORG` and `SENTRY_PROJECT` as EAS env vars matching your Sentry project slugs, plus `SENTRY_AUTH_TOKEN` as a secret (from Sentry → Settings → Auth Tokens).

## Project structure

```
src/
  data/         # Meeqat coordinates and Haram polygon (static, bundled)
  screens/      # MapScreen, HaramScreen, AlertsScreen, ChecklistScreen
  services/     # LocationService (background tracking), NotificationService
  utils/        # geo.ts — haversine, bearing, arc, polygon utilities
```
