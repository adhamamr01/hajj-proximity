import * as Location from 'expo-location'
import * as TaskManager from 'expo-task-manager'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { MEEQAT_POINTS } from '../data/meeqat'
import { HARAM_POLYGON } from '../data/haram'
import { sendMeeqatAlert, sendHaramEntryAlert, sendHaramExitAlert } from './NotificationService'
import { evaluateLocationUpdate, AlertState } from './alertLogic'

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
  const [thresholdStr, meeqatEnabledStr, haramEnabledStr, alertedStr, prevStatusStr] = await Promise.all([
    AsyncStorage.getItem(THRESHOLD_KEY),
    AsyncStorage.getItem(MEEQAT_ALERTS_KEY),
    AsyncStorage.getItem(HARAM_ALERTS_KEY),
    AsyncStorage.getItem(ALERTED_MEEQAT_KEY),
    AsyncStorage.getItem(HARAM_STATUS_KEY),
  ])

  const state: AlertState = {
    alertedMeeqatIds: alertedStr ? JSON.parse(alertedStr) : [],
    haramStatus: prevStatusStr === 'inside' ? 'inside' : prevStatusStr === 'outside' ? 'outside' : null,
  }

  const { meeqatAlerts, haramEvent, nextState } = evaluateLocationUpdate(
    pos,
    MEEQAT_POINTS,
    HARAM_POLYGON,
    {
      thresholdKm: thresholdStr ? parseFloat(thresholdStr) : DEFAULT_THRESHOLD_KM,
      meeqatAlertsOn: meeqatEnabledStr !== 'false',
      haramAlertsOn: haramEnabledStr !== 'false',
    },
    state,
  )

  for (const alert of meeqatAlerts) {
    await sendMeeqatAlert(alert.meeqatName, alert.distKm)
  }
  if (haramEvent === 'entered') await sendHaramEntryAlert()
  if (haramEvent === 'exited') await sendHaramExitAlert()

  if (nextState.alertedMeeqatIds !== state.alertedMeeqatIds) {
    await AsyncStorage.setItem(ALERTED_MEEQAT_KEY, JSON.stringify(nextState.alertedMeeqatIds))
  }
  if (nextState.haramStatus !== state.haramStatus && nextState.haramStatus) {
    await AsyncStorage.setItem(HARAM_STATUS_KEY, nextState.haramStatus)
  }
})

// ── Public API ───────────────────────────────────────────────────────────────

export type LocationPermissionResult = 'granted' | 'foreground_denied' | 'background_denied'

export async function requestLocationPermission(): Promise<LocationPermissionResult> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync()
  if (fg !== 'granted') return 'foreground_denied'
  const { status: bg } = await Location.requestBackgroundPermissionsAsync()
  return bg === 'granted' ? 'granted' : 'background_denied'
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
