import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { translations } from '../i18n/translations'
import { resolveLocale, LANGUAGE_PREFERENCE_KEY } from '../i18n/locale'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return false
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('proximity', {
      name: 'Proximity Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    })
  }
  return true
}

const IMMEDIATE_TRIGGER = Platform.OS === 'android' ? { channelId: 'proximity' } : null

// This module runs from a background task with no React tree, so it can't
// use useTranslation() — it reads the same stored preference directly.
async function getNotificationStrings() {
  const stored = await AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY)
  const preference = stored === 'en' || stored === 'ar' ? stored : 'system'
  const deviceLocaleCode = Localization.getLocales()[0]?.languageCode ?? 'en'
  const locale = resolveLocale(preference, deviceLocaleCode)
  return translations[locale]
}

export async function sendMeeqatAlert(meeqatName: string, distanceKm: number): Promise<void> {
  const strings = await getNotificationStrings()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: strings.notifMeeqatTitle,
      body: strings.notifMeeqatBody
        .replace('{km}', String(Math.round(distanceKm)))
        .replace('{name}', meeqatName),
      sound: 'default',
      data: { type: 'meeqat' },
    },
    trigger: IMMEDIATE_TRIGGER,
  })
}

export async function sendHaramEntryAlert(): Promise<void> {
  const strings = await getNotificationStrings()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: strings.notifHaramEntryTitle,
      body: strings.notifHaramEntryBody,
      sound: 'default',
      data: { type: 'haram_entry' },
    },
    trigger: IMMEDIATE_TRIGGER,
  })
}

export async function sendHaramExitAlert(): Promise<void> {
  const strings = await getNotificationStrings()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: strings.notifHaramExitTitle,
      body: strings.notifHaramExitBody,
      sound: 'default',
      data: { type: 'haram_exit' },
    },
    trigger: IMMEDIATE_TRIGGER,
  })
}
