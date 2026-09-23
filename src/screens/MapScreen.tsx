import { useEffect, useRef, useState, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking, Alert } from 'react-native'
import MapView, { Marker, Polyline, Polygon, Circle, Callout, PROVIDER_GOOGLE, MapType } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { MEEQAT_POINTS, MAKKAH } from '../data/meeqat'
import { distKm, isInsidePolygon, bearingTo, midBearing, arcPoints, destPoint } from '../utils/geo'
import { HARAM_POLYGON } from '../data/haram'
import { useTranslation } from '../i18n/I18nProvider'

const HARAM_COORDS = HARAM_POLYGON.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))

// Shared by the arcs and the connector bands below, so the two touch exactly:
// an arc is trimmed back from its true boundary by the same real-world
// distance the band is offset from the connector at that radius.
const OFFSET_KM = 6

export default function MapScreen() {
  const { t, locale } = useTranslation()
  const mapRef = useRef<MapView>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [nearestMeeqat, setNearestMeeqat] = useState<{ name: string; dist: number } | null>(null)
  const [insideHaram, setInsideHaram] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [mapType, setMapType] = useState<MapType>('standard')

  // Sectors: each meeqat's bearing/radius plus the [start, end] bearing range
  // of its arc — kept around (not just the plotted coords) so the connector
  // bands below can test a point against every sector's true boundary.
  const sectors = useMemo(() => {
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
      return {
        ...p,
        start: midBearing(prev.bearing, p.bearing),
        end: midBearing(p.bearing, next.bearing),
      }
    })
  }, [])

  // Compute arcs — same algorithm as the website. At each boundary
  // (sectors[].start/.end, still used as-is by the connectors and bands
  // below), whichever of the two neighboring meeqats is farther from Makkah
  // crosses over the connector to touch the far dotted line; the nearer one
  // stops short of the connector to touch the near dotted line, same as
  // before. Both trims/extensions use the same OFFSET_KM the bands are
  // offset by, so every touch point lands exactly on its line.
  const arcs = useMemo(() => {
    const n = sectors.length
    return sectors.map((s, i) => {
      const prev = sectors[(i - 1 + n) % n]
      const next = sectors[(i + 1) % n]
      const trim = (OFFSET_KM / s.radius) * (180 / Math.PI)
      const start = s.radius > prev.radius ? s.start - trim : s.start + trim
      const end = s.radius > next.radius ? s.end + trim : s.end - trim
      return {
        id: s.id,
        color: s.color,
        coords: arcPoints(MAKKAH, s.radius, start, end).map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
      }
    })
  }, [sectors])

  // Straight segments at the sector boundary's true bearing, from one
  // meeqat's radius to the next's — built from sectors[].end directly, not
  // from the (now trimmed) arc endpoints, since the dotted bands below are
  // anchored to that same true bearing and must stay parallel to this line.
  const connectors = useMemo(() => {
    const n = sectors.length
    return sectors.map((a, i) => {
      const b = sectors[(i + 1) % n]
      const boundary = a.end
      const [lat1, lng1] = destPoint(MAKKAH, boundary, a.radius)
      const [lat2, lng2] = destPoint(MAKKAH, boundary, b.radius)
      return {
        id: `${a.id}-${b.id}`,
        coords: [{ latitude: lat1, longitude: lng1 }, { latitude: lat2, longitude: lng2 }],
      }
    })
  }, [sectors])

  // Two dotted lines flanking each connector, colored like the farther of
  // its two neighboring meeqats, each offset from the connector by the same
  // OFFSET_KM the arcs are trimmed by. Each line spans the connector's full
  // length (the same [0,1] range as the straight segment it flanks) rather
  // than a clipped sub-section, since the arcs no longer reach far enough to
  // overlap them.
  const connectorBands = useMemo(() => {
    const SAMPLES = 40
    const n = sectors.length
    const bands: { id: string; color: string; coords: { latitude: number; longitude: number }[] }[] = []

    sectors.forEach((a, i) => {
      const b = sectors[(i + 1) % n]
      const boundary = a.end
      const farther = a.radius >= b.radius ? a : b
      const deltaA = (OFFSET_KM / a.radius) * (180 / Math.PI)
      const deltaB = (OFFSET_KM / b.radius) * (180 / Math.PI)

      for (const side of [-1, 1] as const) {
        const coords = Array.from({ length: SAMPLES + 1 }, (_, s) => {
          const t = s / SAMPLES
          const bearing = boundary + side * (deltaA + (deltaB - deltaA) * t)
          const radius = a.radius + (b.radius - a.radius) * t
          const [lat, lng] = destPoint(MAKKAH, bearing, radius)
          return { latitude: lat, longitude: lng }
        })
        bands.push({ id: `${a.id}-${b.id}-${side}`, color: farther.color, coords })
      }
    })

    return bands
  }, [sectors])

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

  // react-native-maps' Circle has no onPress of its own, so hit-test taps
  // on the map against the circle's border (a small tolerance band around
  // the 82.5km radius, not the whole filled interior) instead.
  const CIRCLE_BORDER_TOLERANCE_KM = 3
  const handleMapPress = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    if (Math.abs(distKm(MAKKAH, [latitude, longitude]) - 82.5) <= CIRCLE_BORDER_TOLERANCE_KM) {
      Alert.alert('', t('meeqatCircleRule'))
    }
  }

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
        mapType={mapType}
        initialRegion={{ latitude: 22.5, longitude: 40.0, latitudeDelta: 8, longitudeDelta: 8 }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
      >
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
            pinColor={point.color}
          >
            {/* Custom callout: the default OS callout truncates the
                description to one line, cutting off most of the text. */}
            <Callout tooltip={false} style={styles.callout}>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutTitle}>
                  {(locale === 'ar' ? point.nameAr : point.name).split(' (')[0]}
                </Text>
                <Text style={styles.calloutText}>
                  {t('distanceFromMakkah', { distance: point.distance })}
                </Text>
                <Text style={styles.calloutText}>
                  {locale === 'ar' ? point.forPilgrimsAr : point.forPilgrims}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Sector arcs */}
        {arcs.map(arc => (
          <Polyline
            key={`arc-${arc.id}`}
            coordinates={arc.coords}
            strokeColor={arc.color}
            strokeWidth={3}
          />
        ))}

        {/* Connectors closing the arcs into one continuous boundary */}
        {connectors.map(c => (
          <Polyline
            key={`connector-${c.id}`}
            coordinates={c.coords}
            strokeColor="#d4af37"
            strokeWidth={2}
          />
        ))}

        {/* Dotted bands flanking each connector, colored like the farther meeqat */}
        {connectorBands.map(band => (
          <Polyline
            key={`band-${band.id}`}
            coordinates={band.coords}
            strokeColor={band.color}
            strokeWidth={1.5}
            lineDashPattern={[4, 4]}
          />
        ))}

        {/* Haram boundary */}
        <Polygon
          coordinates={HARAM_COORDS}
          strokeColor="#16a34a"
          strokeWidth={3}
          fillColor="rgba(34, 197, 94, 0.2)"
        />

        {/* Reference circle: 82.5km radius around Makkah */}
        <Circle
          center={{ latitude: MAKKAH[0], longitude: MAKKAH[1] }}
          radius={82500}
          strokeColor="#d4af37"
          strokeWidth={2}
          fillColor="transparent"
        />
      </MapView>

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

      {/* Satellite/hybrid toggle */}
      <TouchableOpacity
        style={styles.mapTypeBtn}
        onPress={() => setMapType(prev => (prev === 'hybrid' ? 'standard' : 'hybrid'))}
      >
        <Text style={styles.mapTypeBtnText}>
          {mapType === 'hybrid' ? t('mapViewButton') : t('satelliteViewButton')}
        </Text>
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
  mapTypeBtn: {
    position: 'absolute',
    bottom: 90,
    left: 16,
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
  mapTypeBtnText: { fontSize: 13, fontWeight: '600', color: '#1a5f3f' },
  callout: { width: 220 },
  calloutContent: { padding: 4 },
  calloutTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  calloutText: { fontSize: 12, color: '#555', lineHeight: 17 },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  deniedTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  deniedBody: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  deniedBtn: { marginTop: 8, backgroundColor: '#1a5f3f', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  deniedBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
})
