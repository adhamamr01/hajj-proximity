# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project context

## Two apps, one codebase

This repo builds two separate Play Store listings from one source tree, selected by
`EXPO_PUBLIC_APP_VARIANT` (`free` or `premium`), read in `app.config.js`:

| | Free | Premium |
|---|---|---|
| Package | `com.hajjproximity.app` | `com.hajjproximity.app.premium` |
| Play listing | Free | Paid (chosen at creation, cannot change to free later) |
| Fidyah tab | Upsell screen linking to the premium Play listing | Full calculator + Fulfill tab |

**The free build must not ship the premium calculator code.** `src/screens/FidyahScreen.tsx`
and `App.tsx`'s Fulfill-tab gate both use a bare
`process.env.EXPO_PUBLIC_APP_VARIANT === 'premium' ? require('./X').default : null` ternary.
Metro's dead-code elimination only strips the `require()` when it can see that literal
comparison directly in a ternary — wrapping it in a helper, a variable, or anything cleverer
breaks the stripping and the calculator (rules, Fidyah data, Fulfill code) ships in the free
APK again. Verify after any change to these two files by exporting both variants and
grep-ing the bundle for a premium-only symbol, e.g.:
```bash
EXPO_PUBLIC_APP_VARIANT=free npx expo export --platform android --clear --output-dir /tmp/free
EXPO_PUBLIC_APP_VARIANT=premium npx expo export --platform android --clear --output-dir /tmp/prem
grep -c fidyah_fulfillment /tmp/free/_expo/static/js/android/*.hbc   # must be 0
grep -c fidyah_fulfillment /tmp/prem/_expo/static/js/android/*.hbc  # must be 1
```

## Building locally (Docker, not `eas build` in the cloud)

Builds run locally in Docker (image `hajj-proximity-android-build`) rather than on EAS's
servers — this is deliberate (keeps the pipeline free). Roughly:
```bash
docker run --rm \
  -e EXPO_TOKEN -e GOOGLE_MAPS_API_KEY -e SENTRY_AUTH_TOKEN -e EXPO_PUBLIC_SENTRY_DSN \
  -e ORG_GRADLE_PROJECT_reactNativeArchitectures=arm64-v8a \
  -v "<repo path>:/app" -v /app/node_modules -w /app \
  hajj-proximity-android-build \
  bash -c "npm install && eas build --local --profile <preview|preview-premium> --platform android"
```
A build takes ~30 minutes; the Docker VM only has enough memory for one at a time, so
free and premium builds must run sequentially, not in parallel. Windows sleep during a
build corrupts the NDK download — request a keep-awake for the duration.

Secrets are never passed as literal values on the command line. On this machine they're
read from files in `D:\Coding Projects\secrets\hajj-projects\` (outside the repo, not
committed) and exported as env vars before the `docker run`: `expo token.txt`,
`google maps api key.txt`, `sentry auth token.txt` (`.env.local`'s `SENTRY_AUTH_TOKEN`),
and `.env.local`'s `EXPO_PUBLIC_SENTRY_DSN`.

## Sentry

Crash reporting is live (not just wired up) — DSN and org/project are set, source maps
upload on every build (visible in the build log as "Uploaded files to Sentry"). Config:
`tracesSampleRate: 0` in `App.tsx` (crash reports only, no performance tracing, no session
replay, no feedback widget — matches what the privacy policy promises). Each report is
tagged `environment: free` or `premium` via `EXPO_PUBLIC_APP_VARIANT`.

## Fidyah calculator

Shafi'i fiqh rules, cross-checked against three sources: Hashiyat al-Bajuri, Tuhfat
al-Muhtaj, Nihayat al-Muhtaj. Three rules were deliberately implemented per the app
owner's explicit instruction rather than the books' default position: the two described in
the comments at the top of `src/utils/hajjRites.ts` (early departure from Mina; stoning
mudd/dam thresholds), and hairs/nails converting to one full fidyah at three or more
(`expandCounts` in `src/utils/fidyahCalculator.ts`). Get the app owner's
sign-off before changing fidyah logic; ideally get scholar review before any Play Store
release. Umrah supports multiple Umrahs per trip (repeat-the-whole-form model, each with
its own Meeqat/acts/special-cases counts) — Hajj does not, since it's answered once per
calculation. `src/screens/FidyahFulfillScreen.tsx` (the "Fulfill" tab, premium-only) lets
the pilgrim track and tick off progress on what the calculator says is owed.

## Store / Play Console

`store/play-console.md` is a from-the-manifest answer sheet for every Play Console form
(Data Safety, content rating, background-location declaration, etc.) — keep it in sync
with the app if permissions, network calls, or tracking change. `store/listing.md` is the
store listing copy (checked by `store/check-listing.py` for length limits). `store/graphics/`
and `store/screenshots/` hold the icon, feature graphics and chosen screenshots.

## Branching

Work happens on `dev`; `master` is the release branch, updated by merging `dev` in
(`git merge --no-ff dev`), not by committing to it directly.

## Open decisions (as of writing)

- App name: still "Hajj Proximity" / "Hajj Proximity Premium" — a rename was being
  considered but not decided. A rename touches the launcher name, in-app strings, both
  privacy policies, the store listing and the feature graphics, so treat it as one atomic
  change across all of those if it happens.
- Play developer account, payments profile, and the production release builds haven't
  happened yet — `store/play-console.md` section 0 has the ordered checklist.
