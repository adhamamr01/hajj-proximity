import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { HARAM_POLYGON } from '../data/haram'
import { MAKKAH } from '../data/meeqat'
import { isInsidePolygon } from '../utils/geo'
import { useTranslation } from '../i18n/I18nProvider'

const HARAM_COORDS = HARAM_POLYGON.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))

export default function HaramScreen() {
  const { t } = useTranslation()
  const mapRef = useRef<MapView>(null)
  const [insideHaram, setInsideHaram] = useState(false)
  const [hasLocation, setHasLocation] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setPermissionDenied(true); return }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 5000 },
        (loc) => {
          const pos: [number, number] = [loc.coords.latitude, loc.coords.longitude]
          setUserLocation(pos)
          setHasLocation(true)
          setInsideHaram(isInsidePolygon(pos, HARAM_POLYGON))
        },
      )
    }

    start()
    return () => { subscription?.remove() }
  }, [])

  const centerOnUser = () => {
    if (!userLocation) return
    mapRef.current?.animateToRegion({
      latitude: userLocation[0],
      longitude: userLocation[1],
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    }, 500)
  }

  const centerOnHaram = () => {
    mapRef.current?.animateToRegion({
      latitude: MAKKAH[0],
      longitude: MAKKAH[1],
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    }, 500)
  }

  if (permissionDenied) {
    return (
      <View style={styles.denied}>
        <Ionicons name="location-outline" size={48} color="#ccc" />
        <Text style={styles.deniedTitle}>{t('locationAccessRequiredTitle')}</Text>
        <Text style={styles.deniedBody}>{t('haramPermissionDeniedBody')}</Text>
        <TouchableOpacity style={styles.deniedBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.deniedBtnText}>{t('openSettings')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: MAKKAH[0],
          longitude: MAKKAH[1],
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Makkah marker */}
        <Marker
          coordinate={{ latitude: MAKKAH[0], longitude: MAKKAH[1] }}
          title={t('haramMarkerTitle')}
          description={t('haramMarkerDescription')}
        />

        {/* Haram boundary polygon */}
        <Polygon
          coordinates={HARAM_COORDS}
          strokeColor="#16a34a"
          strokeWidth={4}
          fillColor="rgba(34, 197, 94, 0.25)"
        />
      </MapView>

      {/* Status banner */}
      <View style={[styles.banner, insideHaram ? styles.bannerInside : styles.bannerOutside]}>
        {!hasLocation ? (
          <Text style={styles.bannerText}>{t('locating')}</Text>
        ) : insideHaram ? (
          <Text style={styles.bannerText}>{t('insideHaramBanner')}</Text>
        ) : (
          <Text style={styles.bannerText}>{t('outsideHaramBanner')}</Text>
        )}
      </View>


      {/* Buttons */}
      <View style={styles.btnGroup}>
        <TouchableOpacity style={styles.btn} onPress={centerOnHaram}>
          <Text style={styles.btnText}>{t('makkahButton')}</Text>
        </TouchableOpacity>
        {hasLocation && (
          <TouchableOpacity style={styles.btn} onPress={centerOnUser}>
            <Text style={styles.btnText}>{t('myLocationButton')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  banner: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bannerInside: { backgroundColor: '#15803d' },
  bannerOutside: { backgroundColor: '#1a5f3f' },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  btnGroup: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    gap: 8,
  },
  btn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  btnText: { fontSize: 13, fontWeight: '600', color: '#1a5f3f' },
  disclaimer: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  disclaimerText: { color: '#fff', fontSize: 11, textAlign: 'center', lineHeight: 16 },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  deniedTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  deniedBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  deniedBtn: { marginTop: 8, backgroundColor: '#1a5f3f', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  deniedBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
