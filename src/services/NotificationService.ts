import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

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

export async function sendMeeqatAlert(meeqatName: string, distanceKm: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Approaching Meeqat',
      body: `You are ${Math.round(distanceKm)} km from ${meeqatName}. Prepare your Ihram.`,
      sound: 'default',
      data: { type: 'meeqat' },
    },
    trigger: IMMEDIATE_TRIGGER,
  })
}

export async function sendHaramEntryAlert(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Entered the Haram',
      body: 'You have entered the boundary of the Haram sanctuary.',
      sound: 'default',
      data: { type: 'haram_entry' },
    },
    trigger: IMMEDIATE_TRIGGER,
  })
}

export async function sendHaramExitAlert(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Exited the Haram',
      body: 'You have exited the boundary of the Haram sanctuary.',
      sound: 'default',
      data: { type: 'haram_exit' },
    },
    trigger: IMMEDIATE_TRIGGER,
  })
}
