import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { I18nManager } from 'react-native'
import * as Localization from 'expo-localization'
import * as Updates from 'expo-updates'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { translations, TranslationKey } from './translations'
import { resolveLocale, isRTL, Locale, LocalePreference, LANGUAGE_PREFERENCE_KEY } from './locale'

interface I18nContextValue {
  locale: Locale
  preference: LocalePreference
  setPreference: (pref: LocalePreference) => Promise<void>
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
    template,
  )
}

function getDeviceLocaleCode(): string {
  return Localization.getLocales()[0]?.languageCode ?? 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY)
      .then(stored => {
        if (stored === 'en' || stored === 'ar' || stored === 'system') setPreferenceState(stored)
      })
      .catch(() => {
        // Fall back to 'system' (the initial state) if storage read fails.
      })
      .finally(() => setReady(true))
  }, [])

  const locale = resolveLocale(preference, getDeviceLocaleCode())

  const setPreference = useCallback(async (pref: LocalePreference) => {
    await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, pref)
    setPreferenceState(pref)

    const nextRTL = isRTL(resolveLocale(pref, getDeviceLocaleCode()))
    if (nextRTL !== I18nManager.isRTL) {
      I18nManager.allowRTL(nextRTL)
      I18nManager.forceRTL(nextRTL)
      // Layout direction only takes effect after a reload — reloadAsync()
      // is unavailable in some dev/Expo Go contexts, in which case the
      // preference is already saved and applies on the next full restart.
      await Updates.reloadAsync().catch(() => {})
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      interpolate(translations[locale][key] ?? translations.en[key], params),
    [locale],
  )

  if (!ready) return null

  return (
    <I18nContext.Provider value={{ locale, preference, setPreference, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider')
  return ctx
}
