import { useEffect, useState } from 'react'
import { View, Text, Switch, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as IntentLauncher from 'expo-intent-launcher'
import {
  startTracking, stopTracking, isTracking,
  getThreshold, setThreshold, resetAlerts,
  requestLocationPermission, DEFAULT_THRESHOLD_KM,
} from '../services/LocationService'
import { requestNotificationPermission } from '../services/NotificationService'
import { useTranslation } from '../i18n/I18nProvider'
import { LocalePreference } from '../i18n/locale'

const THRESHOLDS = [10, 20, 50]
const MEEQAT_ALERTS_KEY = 'meeqat_alerts_enabled'
const HARAM_ALERTS_KEY = 'haram_alerts_enabled'

export default function AlertsScreen() {
  const { t, preference, setPreference } = useTranslation()
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
        t('locationPermissionRequiredTitle'),
        t('locationPermissionRequiredBody'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('openSettings'), onPress: () => Linking.openSettings() },
        ],
      )
      return
    }
    if (locResult === 'background_denied') {
      Alert.alert(
        t('backgroundLocationRequiredTitle'),
        t('backgroundLocationRequiredBody'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('openSettings'), onPress: () => Linking.openSettings() },
        ],
      )
      return
    }
    const notifGranted = await requestNotificationPermission()
    if (!notifGranted) {
      Alert.alert(t('notificationPermissionRequiredTitle'), t('notificationPermissionRequiredBody'))
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

  const openBatterySettings = () => {
    IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS')
  }

  const handleReset = () => {
    Alert.alert(t('resetAlertsTitle'), t('resetAlertsConfirmBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('reset'), style: 'destructive', onPress: resetAlerts },
    ])
  }

  const handleLanguageChange = (pref: LocalePreference) => {
    if (pref === preference) return
    Alert.alert(t('restartRequiredTitle'), t('restartRequiredBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('restartNow'), onPress: () => setPreference(pref) },
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tracking toggle */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('backgroundTrackingTitle')}</Text>
        <Text style={styles.cardDescription}>{t('backgroundTrackingDesc')}</Text>
        <TouchableOpacity
          style={[styles.trackingBtn, tracking && styles.trackingBtnActive]}
          onPress={toggleTracking}
        >
          <Text style={styles.trackingBtnText}>
            {tracking ? t('trackingActive') : t('startTracking')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alert types */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('alertTypesTitle')}</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{t('meeqatProximityLabel')}</Text>
            <Text style={styles.rowDescription}>{t('meeqatProximityDesc')}</Text>
          </View>
          <Switch
            value={meeqatEnabled}
            onValueChange={handleMeeqatToggle}
            trackColor={{ true: '#1a5f3f' }}
          />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <View style={styles.rowText}>
            <Text style={styles.rowLabel}>{t('haramBoundaryLabel')}</Text>
            <Text style={styles.rowDescription}>{t('haramBoundaryDesc')}</Text>
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
        <Text style={styles.cardTitle}>{t('meeqatDistanceTitle')}</Text>
        <Text style={styles.cardDescription}>{t('meeqatDistanceDesc')}</Text>
        <View style={styles.thresholdRow}>
          {THRESHOLDS.map(km => (
            <TouchableOpacity
              key={km}
              style={[styles.thresholdBtn, threshold === km && styles.thresholdBtnActive]}
              onPress={() => handleThreshold(km)}
            >
              <Text style={[styles.thresholdBtnText, threshold === km && styles.thresholdBtnTextActive]}>
                {t('thresholdOption', { km })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('languageTitle')}</Text>
        <Text style={styles.cardDescription}>{t('languageDesc')}</Text>
        <View style={styles.thresholdRow}>
          {([
            ['system', t('languageSystem')],
            ['en', t('languageEnglish')],
            ['ar', t('languageArabic')],
          ] as [LocalePreference, string][]).map(([pref, label]) => (
            <TouchableOpacity
              key={pref}
              style={[styles.thresholdBtn, preference === pref && styles.thresholdBtnActive]}
              onPress={() => handleLanguageChange(pref)}
            >
              <Text style={[styles.thresholdBtnText, preference === pref && styles.thresholdBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Battery optimization */}
      {Platform.OS === 'android' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('batteryTitle')}</Text>
          <Text style={styles.cardDescription}>{t('batteryDesc')}</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={openBatterySettings}>
            <Text style={styles.secondaryBtnText}>{t('openBatterySettings')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Reset */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('resetAlertsTitle')}</Text>
        <Text style={styles.cardDescription}>{t('resetAlertsDesc')}</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>{t('resetAllAlerts')}</Text>
        </TouchableOpacity>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('aboutTitle')}</Text>
        <Text style={styles.cardDescription}>{t('aboutMadhhabNotice')}</Text>
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
  thresholdBtnText: { fontSize: 14, fontWeight: '600', color: '#888', textAlign: 'center' },
  thresholdBtnTextActive: { color: '#1a5f3f' },
  resetBtn: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  resetBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 14 },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#1a5f3f',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: { color: '#1a5f3f', fontWeight: '600', fontSize: 14 },
})
