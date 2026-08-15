export type Locale = 'en' | 'ar'
export type LocalePreference = 'system' | Locale

export const LANGUAGE_PREFERENCE_KEY = 'app_language_preference'

/**
 * Pure decision function: given the user's stored preference and the
 * device's reported locale code, decides which language to actually use.
 * No AsyncStorage/expo-localization access here, so it's testable without
 * a device — mirrors the evaluateLocationUpdate() pattern in alertLogic.ts.
 */
export function resolveLocale(preference: LocalePreference, deviceLocaleCode: string): Locale {
  if (preference === 'en' || preference === 'ar') return preference
  return deviceLocaleCode.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function isRTL(locale: Locale): boolean {
  return locale === 'ar'
}
