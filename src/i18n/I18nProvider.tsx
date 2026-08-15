import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { I18nManager } from 'react-native'
import * as Localization from 'expo-localization'
import * as Updates from 'expo-updates'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { translations, TranslationKey } from './translations'
import { resolveLocale, isRTL, Locale, LocalePreference, LANGUAGE_PREFERENCE_KEY } from './locale'
import { log, logError } from '../utils/log'

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
  try {
    return Localization.getLocales()[0]?.languageCode ?? 'en'
  } catch (e) {
    logError('i18n', 'getLocales() threw, falling back to en', e)
    return 'en'
  }
}

// RTL flips require a reload to take effect. Guard so a single app session
// never reloads more than once — if forceRTL somehow failed to persist,
// looping reloads would brick the app worse than a wrong layout direction.
let rtlReloadAttempted = false

async function syncRTL(locale: Locale): Promise<void> {
  const wantRTL = isRTL(locale)
  if (wantRTL === I18nManager.isRTL) return

  log('i18n', `RTL mismatch (want ${wantRTL}, have ${I18nManager.isRTL})`)
  I18nManager.allowRTL(wantRTL)
  I18nManager.forceRTL(wantRTL)

  if (rtlReloadAttempted) {
    log('i18n', 'reload already attempted this session, direction applies on next launch')
    return
  }
  rtlReloadAttempted = true

  try {
    log('i18n', 'reloading app to apply layout direction')
    await Updates.reloadAsync()
  } catch (e) {
    // reloadAsync is unavailable in dev / Expo Go — the flag is persisted
    // natively, so the correct direction applies on the next full launch.
    logError('i18n', 'reloadAsync unavailable, direction applies on next launch', e)
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>('system')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    log('i18n', 'loading stored language preference')
    AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY)
      .then(stored => {
        log('i18n', `stored preference: ${stored ?? 'none'}`)
        const pref: LocalePreference =
          stored === 'en' || stored === 'ar' || stored === 'system' ? stored : 'system'
        setPreferenceState(pref)
        // Cold-start RTL sync (used to live in index.ts, but deferring
        // registerRootComponent behind it caused a startup hang — see index.ts).
        return syncRTL(resolveLocale(pref, getDeviceLocaleCode()))
      })
      .catch(e => {
        logError('i18n', 'failed to load preference, using system default', e)
      })
      .finally(() => {
        log('i18n', 'i18n ready')
        setReady(true)
      })
  }, [])

  const locale = resolveLocale(preference, getDeviceLocaleCode())

  const setPreference = useCallback(async (pref: LocalePreference) => {
    log('i18n', `setting preference to ${pref}`)
    try {
      await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, pref)
    } catch (e) {
      logError('i18n', 'failed to persist preference', e)
    }
    setPreferenceState(pref)
    await syncRTL(resolveLocale(pref, getDeviceLocaleCode()))
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
