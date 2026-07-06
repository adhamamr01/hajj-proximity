import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MEEQAT_POINTS } from '../data/meeqat'
import { HARAM_POLYGON } from '../data/haram'
import { distKm, isInsidePolygon } from '../utils/geo'
import { sendMeeqatAlert, sendHaramEntryAlert, sendHaramExitAlert } from './NotificationService'

export const LOCATION_TASK = 'hajj-proximity-location'

const ALERTED_MEEQAT_KEY = 'alerted_meeqat'
const HARAM_STATUS_KEY = 'haram_status'
const THRESHOLD_KEY = 'alert_threshold_km'
const MEEQAT_ALERTS_KEY = 'meeqat_alerts_enabled'
const HARAM_ALERTS_KEY = 'haram_alerts_enabled'

export const DEFAULT_THRESHOLD_KM = 20

// ── Background task ──────────────────────────────────────────────────────────

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error || !data) return

  const { locations } = data as { locations: Location.LocationObject[] }
  const loc = locations[locations.length - 1]
  if (!loc) return

  const pos: [number, number] = [loc.coords.latitude, loc.coords.longitude]
  const [thresholdStr, meeqatEnabledStr, haramEnabledStr] = await Promise.all([
    AsyncStorage.getItem(THRESHOLD_KEY),
    AsyncStorage.getItem(MEEQAT_ALERTS_KEY),
    AsyncStorage.getItem(HARAM_ALERTS_KEY),
  ])
  const threshold = thresholdStr ? parseFloat(thresholdStr) : DEFAULT_THRESHOLD_KM
  const meeqatAlertsOn = meeqatEnabledStr !== 'false'
  const haramAlertsOn = haramEnabledStr !== 'false'

  // ── Meeqat proximity check ────────────────────────────────────────────────
  if (meeqatAlertsOn) {
    const alertedStr = await AsyncStorage.getItem(ALERTED_MEEQAT_KEY)
    const alerted: string[] = alertedStr ? JSON.parse(alertedStr) : []

    for (const meeqat of MEEQAT_POINTS) {
      const dist = distKm(pos, [meeqat.lat, meeqat.lng])
      if (dist <= threshold && !alerted.includes(meeqat.id)) {
        await sendMeeqatAlert(meeqat.name, dist)
        alerted.push(meeqat.id)
        await AsyncStorage.setItem(ALERTED_MEEQAT_KEY, JSON.stringify(alerted))
      }
    }
  }

  // ── Haram boundary check ──────────────────────────────────────────────────
  if (haramAlertsOn) {
    const insideNow = isInsidePolygon(pos, HARAM_POLYGON)
    const prevStatusStr = await AsyncStorage.getItem(HARAM_STATUS_KEY)
    const wasInside = prevStatusStr === 'inside'

    if (insideNow && !wasInside) {
      await sendHaramEntryAlert()
      await AsyncStorage.setItem(HARAM_STATUS_KEY, 'inside')
    } else if (!insideNow && wasInside) {
      await sendHaramExitAlert()
      await AsyncStorage.setItem(HARAM_STATUS_KEY, 'outside')
    }
  }
})

// ── Public API ───────────────────────────────────────────────────────────────

export async function requestLocationPermission(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync()
  if (fg !== 'granted') return false
  const { status: bg } = await Location.requestBackgroundPermissionsAsync()
  return bg === 'granted'
}

export async function startTracking(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
  if (running) return
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 500,   // update every 500 m of movement
    timeInterval: 30_000,    // or every 30 seconds, whichever comes first
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Hajj Proximity',
      notificationBody: 'Monitoring your location for Meeqat and Haram alerts.',
      notificationColor: '#1a5f3f',
    },
  })
}

export async function stopTracking(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
  if (running) await Location.stopLocationUpdatesAsync(LOCATION_TASK)
}

export async function isTracking(): Promise<boolean> {
  return Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false)
}

export async function getThreshold(): Promise<number> {
  const val = await AsyncStorage.getItem(THRESHOLD_KEY)
  return val ? parseFloat(val) : DEFAULT_THRESHOLD_KM
}

export async function setThreshold(km: number): Promise<void> {
  await AsyncStorage.setItem(THRESHOLD_KEY, String(km))
}

export async function resetAlerts(): Promise<void> {
  await AsyncStorage.removeItem(ALERTED_MEEQAT_KEY)
  await AsyncStorage.removeItem(HARAM_STATUS_KEY)
}
