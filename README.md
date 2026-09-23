# Hajj Proximity

A React Native app that helps pilgrims track their approach to the Meeqat boundaries and
the Haram of Makkah, works out which fidyah (expiation) applies during Ihram, and tracks
fulfilling it. Ships as two separate Play Store apps built from this one codebase — see
[Free vs Premium](#free-vs-premium) below.

## Features

- **Meeqat map** — live map showing all 5 Ihram stations with colour-coded sector arcs, an
  82.5 km reference circle for pilgrims who don't pass a Meeqat, your position, and the
  nearest Meeqat with distance
- **Haram boundary** — dedicated map tab with the Sacred Mosque boundary polygon and
  inside/outside status
- **Proximity alerts** — background location tracking sends a local notification when you
  approach a Meeqat (configurable threshold: 10 / 20 / 50 km) or cross into/out of the Haram
- **Ihram checklist** — 11-step pre-Ihram checklist (hair/nail removal, ghusl, perfume,
  garments, prayer, niyyah, the full talbiyah, the prohibited acts) persisted locally
- **Fidyah calculator** *(Premium)* — works out which expiation applies for missed rites or
  prohibited acts during Ihram, for Hajj and for one or more Umrahs on the same trip, based
  on Shafi'i fiqh
- **Fulfill Fidyah** *(Premium)* — tracks the fidyah the calculator found (or one entered by
  hand), lets the pilgrim choose how they'll fulfil each one, and ticks off progress
- **Offline-first** — all Meeqat coordinates and the Haram boundary polygon are bundled in
  the app; only the map tiles need a connection
- English and Arabic, with RTL layout

## Free vs Premium

| | Free (`com.hajjproximity.app`) | Premium (`com.hajjproximity.app.premium`) |
|---|---|---|
| Map, Haram, alerts, checklist | Yes | Yes |
| Fidyah tab | Links to the Premium Play listing | Full calculator |
| Fulfill Fidyah tab | Not present | Yes |

Selected at build time by `EXPO_PUBLIC_APP_VARIANT` (`free` or `premium`), read in
`app.config.js`. The free build's JS bundle contains none of the premium calculator code —
see `AGENTS.md` if you're changing anything in that gate.

## Stack

| Layer | Technology |
|---|---|
| Framework | Expo (React Native) |
| Language | TypeScript |
| Maps | react-native-maps + Google Maps SDK (Android) |
| Location | expo-location (foreground + background) |
| Notifications | expo-notifications (local only) |
| Storage | @react-native-async-storage/async-storage |
| Crash reporting | Sentry (crash reports only — no performance tracing, no session replay) |
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
eas build --profile preview --platform android           # free
eas build --profile preview-premium --platform android    # premium
```

The APK link appears in the EAS dashboard when the build completes. In practice, builds
for this project run locally in Docker instead of on EAS's servers, to keep the pipeline
free — see `AGENTS.md` for that process.

## Environment

The Google Maps API key is stored as an EAS secret (`GOOGLE_MAPS_API_KEY`) and is never
committed to the repository. To set it:

```bash
eas env:create --variable-name GOOGLE_MAPS_API_KEY --value YOUR_KEY --environment production --visibility secret
```

The key's Android-app restrictions need an entry (package name + SHA-1) for every signing
certificate that will run the app — the local debug builds' certificates, and later each
Play listing's App Signing certificate.

### Crash reporting (Sentry)

Crash reporting is live: `EXPO_PUBLIC_SENTRY_DSN` is set, so `Sentry.init()` in `App.tsx`
runs, and `SENTRY_ORG` / `SENTRY_PROJECT` are set on every build profile in `eas.json` so
source maps upload automatically (needs `SENTRY_AUTH_TOKEN` as a secret at build time, from
Sentry → Settings → Auth Tokens). It's configured crash-only — `tracesSampleRate: 0`, no
session replay, no feedback widget — and each report is tagged `environment: free` or
`premium`. To point it at a different Sentry project, set the same four values for that
project instead.

## Project structure

```
src/
  data/         # Meeqat coordinates, Haram polygon, Fidyah items and tiers (static, bundled)
  i18n/         # English/Arabic translations, locale resolution, RTL
  screens/      # MapScreen, HaramScreen, AlertsScreen, ChecklistScreen,
                # FidyahScreen (free/premium gate), FidyahCalculatorScreen,
                # FidyahFulfillScreen (both Premium-only), FidyahUpsellScreen (free-only)
  services/     # LocationService (background tracking), NotificationService,
                # locationDisclosure (background-location consent dialog),
                # fidyahFulfillmentStorage (Premium)
  utils/        # geo.ts (haversine, bearing, arc, polygon), hajjRites.ts and
                # fidyahCalculator.ts (fidyah rules), fidyahFulfillment.ts (Premium)
```

Play Store listing text, screenshots and the Play Console answer sheet live in `store/`.
