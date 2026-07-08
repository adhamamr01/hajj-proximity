import { useEffect, useRef, useState, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native'
import MapView, { Marker, Polyline, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { MEEQAT_POINTS, MAKKAH } from '../data/meeqat'
import { TILE_URL, TILE_ATTRIBUTION, getTileCachePath, TILE_CACHE_MAX_AGE_SECONDS } from '../utils/tiles'
import { distKm, isInsidePolygon, bearingTo, midBearing, arcPoints } from '../utils/geo'
import { HARAM_POLYGON } from '../data/haram'
import { useTranslation } from '../i18n/I18nProvider'

export default function MapScreen() {
  const { t, locale } = useTranslation()
  const mapRef = useRef<MapView>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [nearestMeeqat, setNearestMeeqat] = useState<{ name: string; dist: number } | null>(null)
  const [insideHaram, setInsideHaram] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Compute arcs — same algorithm as the website
  const arcs = useMemo(() => {
    const enriched = MEEQAT_POINTS
      .map(p => ({
        ...p,
        bearing: bearingTo(MAKKAH, [p.lat, p.lng]),
        radius: distKm(MAKKAH, [p.lat, p.lng]),
      }))
      .sort((a, b) => a.bearing - b.bearing)

    const n = enriched.length
    return enriched.map((p, i) => {
      const prev = enriched[(i - 1 + n) % n]
      const next = enriched[(i + 1) % n]
      const start = midBearing(prev.bearing, p.bearing)
      const end = midBearing(p.bearing, next.bearing)
      const pts = arcPoints(MAKKAH, p.radius, start, end)
      return {
        id: p.id,
        color: p.color,
        coords: pts.map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
      }
    })
  }, [])

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setPermissionDenied(true); return }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 100, timeInterval: 5000 },
        (loc) => {
          const pos: [number, number] = [loc.coords.latitude, loc.coords.longitude]
          setUserLocation(pos)
          setInsideHaram(isInsidePolygon(pos, HARAM_POLYGON))

          const nearest = MEEQAT_POINTS
            .map(m => ({
              name: (locale === 'ar' ? m.nameAr : m.name).split(' (')[0],
              dist: distKm(pos, [m.lat, m.lng]),
            }))
            .sort((a, b) => a.dist - b.dist)[0]
          setNearestMeeqat(nearest)
        },
      )
    }

    start()
    return () => { subscription?.remove() }
  }, [locale])

  const centerOnUser = () => {
    if (!userLocation) return
    mapRef.current?.animateToRegion({
      latitude: userLocation[0],
      longitude: userLocation[1],
      latitudeDelta: 1,
      longitudeDelta: 1,
    }, 500)
  }

  if (permissionDenied) {
    return (
      <View style={styles.denied}>
        <Ionicons name="location-outline" size={48} color="#ccc" />
        <Text style={styles.deniedTitle}>{t('locationAccessRequiredTitle')}</Text>
        <Text style={styles.deniedBody}>{t('mapPermissionDeniedBody')}</Text>
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
        mapType="none"
        initialRegion={{ latitude: 22.5, longitude: 40.0, latitudeDelta: 8, longitudeDelta: 8 }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <UrlTile
          urlTemplate={TILE_URL}
          maximumZ={19}
          tileCachePath={getTileCachePath()}
          tileCacheMaxAge={TILE_CACHE_MAX_AGE_SECONDS}
        />
        {/* Makkah marker */}
        <Marker
          coordinate={{ latitude: MAKKAH[0], longitude: MAKKAH[1] }}
          title={t('makkahMarkerTitle')}
        />

        {/* Meeqat markers */}
        {MEEQAT_POINTS.map(point => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.lat, longitude: point.lng }}
            title={(locale === 'ar' ? point.nameAr : point.name).split(' (')[0]}
            description={`${t('distanceFromMakkah', { distance: point.distance })} · ${locale === 'ar' ? point.forPilgrimsAr : point.forPilgrims}`}
            pinColor={point.color}
          />
        ))}

        {/* Sector arcs */}
        {arcs.map(arc => (
          <Polyline
            key={`arc-${arc.id}`}
            coordinates={arc.coords}
            strokeColor={arc.color}
            strokeWidth={3}
            lineDashPattern={[8, 5]}
          />
        ))}
      </MapView>

      <Text style={styles.attribution}>{TILE_ATTRIBUTION}</Text>

      {/* Status banner */}
      <View style={[styles.banner, insideHaram && styles.bannerHaram]}>
        {insideHaram ? (
          <Text style={styles.bannerText}>{t('insideHaramBanner')}</Text>
        ) : nearestMeeqat ? (
          <Text style={styles.bannerText}>
            {t('nearestMeeqatBanner', { name: nearestMeeqat.name, km: Math.round(nearestMeeqat.dist) })}
          </Text>
        ) : (
          <Text style={styles.bannerText}>{t('locating')}</Text>
        )}
      </View>

      {/* Center on user */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnText}>⊕</Text>
      </TouchableOpacity>
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
    backgroundColor: '#1a5f3f',
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
  bannerHaram: { backgroundColor: '#15803d' },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  centerBtn: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  centerBtnText: { fontSize: 22, color: '#1a5f3f' },
  attribution: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    fontSize: 10,
    color: 'rgba(0,0,0,0.5)',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 4,
  },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  deniedTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  deniedBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  deniedBtn: { marginTop: 8, backgroundColor: '#1a5f3f', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  deniedBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
