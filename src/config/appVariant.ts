import Constants from 'expo-constants'

/**
 * Free and premium ship as separate Play Store listings (separate
 * applicationId, chosen at build time via EXPO_PUBLIC_APP_VARIANT — see
 * app.config.js and eas.json). What differs between them at runtime is
 * decided in FidyahScreen.tsx, where the bundler removes the premium code
 * from the free build; there is deliberately no runtime flag to flip here.
 */
export const PREMIUM_PACKAGE_ID: string =
  Constants.expoConfig?.extra?.premiumPackageId ?? 'com.hajjproximity.app.premium'

export const PREMIUM_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PREMIUM_PACKAGE_ID}`
