# Play Console answer sheet

Answers for the Play Console forms, for both apps. Written from what the app does
today (manifest and code checked on 2026-09-22). Console labels change now and then,
so match by meaning, not exact wording. Items marked **VERIFY** are things I could not
confirm from here; check them in the Console or Google's docs before submitting.

Listing text is in `store/listing.md`. Graphics are in `store/graphics/`, screenshots in
`store/screenshots/`.

| | Free | Premium |
|---|---|---|
| App name | Hajj Proximity | Hajj Proximity Premium |
| Package name | `com.hajjproximity.app` | `com.hajjproximity.app.premium` |
| Free or paid | Free | **Paid. Chosen when the app is created and cannot be changed to free later.** |
| Default language | English (United States), plus Arabic | same |
| App or game | App | App |

---

## 0. Before creating anything

1. Create the Play developer account (one-time fee, identity verification).
2. **VERIFY:** as I understand it, a new *personal* account must run a closed test with
   about 12 testers for 14 days before it can apply for production access. The Console
   shows the exact rule for your account. If it applies, start the test as early as
   possible; it is the longest wait.
3. Set up the payments profile (needed for the paid app).
4. Add the Google Cloud key entries (section 9) so maps work in Play-installed builds.

## 1. Create the app (one per listing)

- Name, default language, App, Free/Paid as in the table above.
- Declarations: accept the Developer Program Policies and the US export laws.

## 2. Store settings

- **Category:** Travel & Local (Play has no religion category).
- **Tags:** pick from the Console's list, for example Maps & Navigation, Religion if offered.
- **Contact email:** adhamamr01.aa@gmail.com
- **Website:** optional. Leave blank or use the GitHub Pages site.
- **Privacy policy URL:** https://adhamamr01.github.io/hajj-proximity/privacy.html
  (Arabic: https://adhamamr01.github.io/hajj-proximity/privacy-ar.html; the Console takes
  one URL, so use the English one and add the Arabic link in the Arabic description if wanted.)

## 3. App content

| Form | Answer |
|---|---|
| Privacy policy | The URL above |
| Ads | No, the app has no ads |
| App access | All functionality is available without login or special access |
| Content rating | Section 4 |
| Target audience | Section 5 |
| Data safety | Section 6 |
| Government app | No |
| Financial features | None (buying the paid app is not a financial feature) |
| Health apps | No |
| Advertising ID | The app does not use it. The built APK has no advertising-ID permission, so answer "No" |
| News app | No |
| Sensitive permissions | Background location and foreground service (location): sections 7 and 8 |

## 4. Content rating (IARC questionnaire)

- **Category:** Utility, Productivity, Communication or Other.
- Violence, blood, sexual content, profanity, controlled substances, gambling: **No**.
- User-generated content, chat, sharing location with other users: **No**.
- Digital purchases inside the app: **No** (neither app has in-app purchases; the free app
  only links to the premium Play listing).
- Unrestricted web browsing: **No**.
- The prohibited-acts list mentions intimate contact and intercourse only as religious
  rulings. Answer honestly if a question touches this. Do not rewrite the app to game the
  rating. Expect Everyone or the equivalent low rating.

## 5. Target audience

- Choose **16-17** and **18 and over**. Do not tick any under-13 group; that would apply
  the Families policy, which the app does not follow.
- Not designed for children: **Yes** (that is, it is not).
- The Console may ask whether the app appeals to children. It does not.

## 6. Data safety

What the app actually does:

- **Location** is read and used **on the device only**. It is never sent anywhere. Play
  defines "collected" as sent off the device, so location is **not collected**.
- **Own network calls:** none. There is no server of ours, no account, no analytics.
- **Sentry** (crash reporting) sends crash and diagnostic data over HTTPS. It is set up
  crash-only: no performance traces, no session replay, no user feedback widget.
- **Google Maps SDK** loads map tiles from Google. **VERIFY** Google's Data safety guidance
  for the Maps SDK before submitting; if it lists items such as IP address or device
  information, declare them as collected and shared with Google, for App functionality.
- **Push notifications:** only local notifications. The app never requests a push token.
  The Firebase parts in the manifest come from the notifications library and are not
  initialised (no `google-services.json`).
- **Over-the-air updates** are off (`expo.modules.updates.ENABLED=false`).
- Premium stores your fidyah list and progress **on the device only**.

Answers (identical for both apps):

| Question | Answer |
|---|---|
| Does your app collect or share any required user data types? | **Yes** (crash reports) |
| Is all collected data encrypted in transit? | **Yes** |
| Can users request deletion? | **VERIFY / decide.** Crash reports are not linked to a person, so there is nothing to look up. Either answer "No" or add a line to the privacy policy inviting an email request, then answer Yes. |

Data types to declare:

| Category | Type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|---|
| App info and performance | Crash logs | Yes | No (Sentry is a service provider acting for you) | Required | App functionality |
| App info and performance | Diagnostics | Yes | No | Required | App functionality |
| Device or other IDs | Device or other IDs | Conservative: **Yes** | No | Required | App functionality |

Everything else (location, personal info, financial info, health, messages, photos,
audio, files, calendar, contacts, web browsing, app activity): **not collected**.

Security practices: encrypted in transit **Yes**; follows the Families policy **No**;
independent security review **No**.

The "Device or other IDs" row is a deliberate over-declaration: Sentry may attach a random
installation ID, and declaring too much is safer than too little. If you confirm it does
not, remove it.

## 7. Background location permission declaration

The app declares `ACCESS_BACKGROUND_LOCATION`. The Console asks you to describe the
feature, why foreground location is not enough, and to provide a video.

**Feature description (paste):**

> Hajj Proximity alerts pilgrims when they approach one of the five Meeqat boundaries, where
> they must enter Ihram, and when they enter or leave the Haram sanctuary in Makkah. This is
> the app's core purpose. Pilgrims travel for hours by car, bus or plane with the phone
> locked or the app closed, so the alerts must work in the background. The user turns this
> on themselves with the "Start Tracking" button and can turn it off at any time. The
> location is compared with fixed coordinates on the device and is never stored or sent
> anywhere.

**Why foreground-only is not enough (paste):**

> The alert is needed exactly when the phone is in a pocket or bag during travel. Requiring
> the app to stay open and on screen would defeat the purpose of the alert.

**Prominent in-app disclosure (already built).** Shown before the system permission prompt,
in `src/services/locationDisclosure.ts`, on the Settings tab when the user taps
"Start Tracking". Text (English):

> Location access in the background
> Hajj Proximity collects your device's location, including when the app is closed or not in
> use, so it can alert you when you approach a Meeqat or enter or leave the Haram.
> Your location is used only on your device for these alerts. It is not stored, shared, or
> sent anywhere.
> When asked next, choose "Allow all the time" to turn this on.
> [Not now] [Continue]

Arabic version is in `src/i18n/translations.ts` (`locationDisclosureBody`).

**Demo video script** (screen recording, upload to YouTube as unlisted, paste the link).
Use a phone with the app freshly installed or its data cleared, so the permission
prompts show:

1. Open the app. Go to the **Settings** tab. Show the "Background Tracking" card.
2. Tap **Start Tracking**. The disclosure dialog appears. Pause so the full text is readable.
3. Tap **Continue**. Show the system location prompt, allow it, then choose **Allow all the
   time** on the next screen.
4. Show the persistent "Monitoring your location…" notification in the notification shade
   (this is the foreground service).
5. Press Home, lock the screen, wake it, and show the notification is still there.
6. If you can, show a Meeqat or Haram alert arriving (a mock-location app helps), or show
   the alert toggles on the Settings tab.
7. Back in the app, tap the red **Tracking Active — Tap to Stop** button to show the user can turn it off.

## 8. Foreground service declaration (type: location)

The manifest declares `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION`, with service
type `location`. The Console asks what the service does and for a video.

**Description (paste):**

> While the user has tracking on, a foreground service with a persistent notification keeps
> the location updates running so the app can alert them near a Meeqat or the Haram
> boundary. It starts only when the user taps "Start Tracking" and stops when they tap the
> button again ("Tracking Active — Tap to Stop"). Location is updated about every 500 m or 30 seconds, at balanced accuracy.

**Video:** the same recording as section 7 works; make sure step 4 (the notification) is clear.

## 9. Google Maps API key

Maps are blank in any build whose package and signing certificate are not on the key.
The key is under Application restrictions, Android apps.

| Entry | Package | SHA-1 |
|---|---|---|
| Free, local test builds | `com.hajjproximity.app` | `AD:40:94:C7:BE:E0:1A:76:6D:C0:AD:18:C1:62:EF:33:59:01:04:12` |
| Premium, local test builds | `com.hajjproximity.app.premium` | `6A:EC:9A:DB:E9:6F:EA:4E:1F:7C:D3:A7:AD:E1:07:56:E0:B7:E7:26` |
| Free, from Play | `com.hajjproximity.app` | **App signing SHA-1 from Play Console, App integrity, of the free app** |
| Premium, from Play | `com.hajjproximity.app.premium` | **App signing SHA-1 from Play Console, App integrity, of the premium app** |

Keep the test entries. Add the two Play entries after each app's first upload.

## 10. Store listing assets

| Asset | File |
|---|---|
| App icon 512x512 | `store/graphics/icon-512.png` (both apps) |
| Feature graphic 1024x500, free | `store/graphics/feature-free.png` |
| Feature graphic 1024x500, premium | `store/graphics/feature-premium.png` |
| Phone screenshots, free (6) | `store/screenshots/free/01..06` |
| Phone screenshots, premium (8) | `store/screenshots/premium/01..08` |
| Text | `store/listing.md`, checked by `store/check-listing.py` |

Screenshots are 1080x2071, inside Play's limit (the long side is at most twice the short
side). Play allows 2 to 8 phone screenshots per listing. Tablet screenshots are optional.

## 11. Pricing and distribution

- **Free app:** free, all countries you want.
- **Premium price:** see the recommendation in the chat and below. Set a base price in one
  currency; Play converts it for other countries. Review the converted prices for
  countries where the base price is a much larger share of income (for example Egypt,
  Pakistan, Indonesia, Bangladesh, Turkey) and lower them by hand if needed.
- **Recommendation:** US$2.99, one time. It can be changed later, but a paid app can never
  be turned into a free one.
- **Countries:** start with all; remove any where you cannot meet local requirements.

## 12. Release

1. Build production bundles: `production` (free) and `production-premium` (premium) in
   `eas.json`. They produce AABs and raise the version code automatically.
2. Use **Play App Signing** (the default). The EAS keystore becomes the upload key; Google
   holds the app signing key. Then do section 9.
3. If a closed test is required: create the closed testing track, add the testers'
   emails (or a Google Group), upload the AAB, and start the 14 days.
4. Then apply for production access, upload the production release with the release notes
   from `store/listing.md`, and submit for review.
5. **Publish premium first.** The free app's "Get Premium" button opens the premium Play
   page (`src/config/appVariant.ts`), which must exist and be live.

## 13. Things that could change these answers

Tell me before changing any of these, because the answers above depend on them:

- **Adding analytics** or any other network call: update the Data safety table and the
  privacy policy first.
- **Turning on Sentry performance tracing, session replay or the feedback widget:** changes
  the Data safety answers and the privacy policy (session replay records the screen).
- **Extra permissions in the built app.** The release APK currently also carries
  `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` (up to
  Android 12), pulled in by libraries. The app does not need them. I recommend blocking
  them with `android.blockedPermissions` in `app.config.js` before the production
  build. This is a config change, not done yet.
- **Changing what the location alerts do,** or storing location anywhere.
- **Adding in-app purchases or ads.**

## 14. Not verified from here

- The exact closed-testing rule for your account (section 0).
- Google's Data safety guidance for the Maps SDK (section 6).
- Whether Sentry attaches a device ID (section 6).
- The exact wording of Console fields, which changes over time.
- Play's service fee. As I understand it, it is 15% on the first US$1 million of yearly
  earnings, but check the current fee page and any tax handling for your country.
