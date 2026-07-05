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

export async function sendMeeqatAlert(meeqatName: string, distanceKm: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Approaching Meeqat',
      body: `You are ${Math.round(distanceKm)} km from ${meeqatName}. Prepare your Ihram.`,
      sound: 'default',
      data: { type: 'meeqat' },
    },
    trigger: null, // immediate
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
    trigger: null,
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
    trigger: null,
  })
}
