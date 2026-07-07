import { registerRootComponent } from 'expo'
import { I18nManager } from 'react-native'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'
import App from './App'
import { resolveLocale, isRTL, LANGUAGE_PREFERENCE_KEY } from './src/i18n/locale'

// Apply the stored language's RTL direction before the first render, so a
// cold start already has the correct layout direction. (Runtime toggles are
// handled separately in I18nProvider.setPreference, which triggers a reload.)
async function bootstrap() {
  const stored = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY)
  const preference = stored === 'en' || stored === 'ar' ? stored : 'system'
  const deviceLocaleCode = Localization.getLocales()[0]?.languageCode ?? 'en'
  const rtl = isRTL(resolveLocale(preference, deviceLocaleCode))

  if (rtl !== I18nManager.isRTL) {
    I18nManager.allowRTL(rtl)
    I18nManager.forceRTL(rtl)
  }

  // registerRootComponent calls AppRegistry.registerComponent('main', () => App);
  // It also ensures that whether you load the app in Expo Go or in a native build,
  // the environment is set up appropriately
  registerRootComponent(App)
}

bootstrap()
