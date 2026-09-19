import Constants from 'expo-constants'

/**
 * Free and premium ship as separate Play Store listings (separate
 * applicationId, baked in at build time via APP_VARIANT — see
 * app.config.js), not one app gated by in-app billing.
 */
export const IS_PREMIUM_BUILD: boolean = Constants.expoConfig?.extra?.isPremiumBuild === true

export const PREMIUM_PACKAGE_ID: string =
  Constants.expoConfig?.extra?.premiumPackageId ?? 'com.hajjproximity.app.premium'

export const PREMIUM_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PREMIUM_PACKAGE_ID}`
