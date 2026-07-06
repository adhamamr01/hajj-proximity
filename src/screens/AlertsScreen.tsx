import { useEffect, useState } from 'react'
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  startTracking, stopTracking, isTracking,
  getThreshold, setThreshold, resetAlerts,
  requestLocationPermission, DEFAULT_THRESHOLD_KM,
} from '../services/LocationService'
import { requestNotificationPermission } from '../services/NotificationService'

const THRESHOLDS = [10, 20, 50]
const MEEQAT_ALERTS_KEY = 'meeqat_alerts_enabled'
const HARAM_ALERTS_KEY = 'haram_alerts_enabled'

export default function AlertsScreen() {
  const [tracking, setTracking]           = useState(false)
  const [meeqatEnabled, setMeeqatEnabled] = useState(true)
  const [haramEnabled, setHaramEnabled]   = useState(true)
  const [threshold, setThresholdState]    = useState(DEFAULT_THRESHOLD_KM)

  useEffect(() => {
    const load = async () => {
      setTracking(await isTracking())
      setThresholdState(await getThreshold())
      const m = await AsyncStorage.getItem(MEEQAT_ALERTS_KEY)
      const h = await AsyncStorage.getItem(HARAM_ALERTS_KEY)
      if (m !== null) setMeeqatEnabled(m === 'true')
      if (h !== null) setHaramEnabled(h === 'true')
    }
    load()
  }, [])

  const toggleTracking = async () => {
    if (tracking) {
      await stopTracking()
      setTracking(false)
      return
    }
    const locResult = await requestLocationPermission()
    if (locResult === 'foreground_denied') {
      Alert.alert(
        'Location Permission Required',
        'Please allow location access so alerts can work.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      )
      return
    }
    if (locResult === 'background_denied') {
      Alert.alert(
        'Background Location Required',
        'To receive alerts while the app is closed, set location access to "Allow all the time" in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      )
      return
    }
    const notifGranted = await requestNotificationPermission()
    if (!notifGranted) {
      Alert.alert('Notification Permission Required', 'Please allow notifications to receive Meeqat alerts.')
      return
    }
    await startTracking()
    setTracking(true)
  }

  const handleThreshold = async (km: number) => {
    setThresholdState(km)
    await setThreshold(km)
  }

  const handleMeeqatToggle = async (val: boolean) => {
    setMeeqatEnabled(val)
    await AsyncStorage.setItem(MEEQAT_ALERTS_KEY, String(val))
  }

  const handleHaramToggle = async (val: boolean) => {
    setHaramEnabled(val)
    await AsyncStorage.setItem(HARAM_ALERTS_KEY, String(val))
  }

  const handleReset = () => {
    Alert.alert('Reset Alerts', 'This will re-enable alerts for all Meeqat points you have already passed. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetAlerts },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tracking toggle */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Background Tracking</Text>
        <Text style={styles.cardDescription}>
          Keep this on while travelling to receive alerts even when the app is closed.
        </Text>
        <TouchableOpacity
          style={[styles.trackingBtn, tracking && styles.trackingBtnActive]}
          onPress={toggleTracking}
        >
          <Text style={styles.trackingBtnText}>
            {tracking ? 'Tracking Active — Tap to Stop' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alert types */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Alert Types</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Meeqat Proximity</Text>
            <Text style={styles.rowDescription}>Alert when approaching a Meeqat boundary</Text>
          </View>
          <Switch
            value={meeqatEnabled}
            onValueChange={handleMeeqatToggle}
            trackColor={{ true: '#1a5f3f' }}
          />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>Haram Boundary</Text>
            <Text style={styles.rowDescription}>Alert when entering or exiting the Haram</Text>
          </View>
          <Switch
            value={haramEnabled}
            onValueChange={handleHaramToggle}
            trackColor={{ true: '#1a5f3f' }}
          />
        </View>
      </View>

      {/* Threshold */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meeqat Alert Distance</Text>
        <Text style={styles.cardDescription}>Alert me when I am this close to a Meeqat:</Text>
        <View style={styles.thresholdRow}>
          {THRESHOLDS.map(km => (
            <TouchableOpacity
              key={km}
              style={[styles.thresholdBtn, threshold === km && styles.thresholdBtnActive]}
              onPress={() => handleThreshold(km)}
            >
              <Text style={[styles.thresholdBtnText, threshold === km && styles.thresholdBtnTextActive]}>
                {km} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Reset */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reset Alerts</Text>
        <Text style={styles.cardDescription}>
          Once a Meeqat alert fires, it won't repeat until you reset. Use this if you want to be alerted again.
        </Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset All Alerts</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f0' },
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  cardDescription: { fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 18 },
  trackingBtn: {
    backgroundColor: '#1a5f3f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  trackingBtnActive: { backgroundColor: '#dc2626' },
  trackingBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  rowDescription: { fontSize: 12, color: '#888', marginTop: 2 },
  thresholdRow: { flexDirection: 'row', gap: 10 },
  thresholdBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  thresholdBtnActive: { borderColor: '#1a5f3f', backgroundColor: '#f0faf4' },
  thresholdBtnText: { fontSize: 14, fontWeight: '600', color: '#888' },
  thresholdBtnTextActive: { color: '#1a5f3f' },
  resetBtn: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
})
