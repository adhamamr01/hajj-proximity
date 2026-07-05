import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import MapView, { Marker, Polygon, Circle, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { MEEQAT_POINTS, MAKKAH } from '../data/meeqat'
import { HARAM_POLYGON } from '../data/haram'
import { distKm, isInsidePolygon } from '../utils/geo'

export default function MapScreen() {
  const mapRef = useRef<MapView>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [nearestMeeqat, setNearestMeeqat] = useState<{ name: string; dist: number } | null>(null)
  const [insideHaram, setInsideHaram] = useState(false)

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 100 },
        (loc) => {
          const pos: [number, number] = [loc.coords.latitude, loc.coords.longitude]
          setUserLocation(pos)
          setInsideHaram(isInsidePolygon(pos, HARAM_POLYGON))

          const nearest = MEEQAT_POINTS
            .map(m => ({ name: m.name.split(' (')[0], dist: distKm(pos, [m.lat, m.lng]) }))
            .sort((a, b) => a.dist - b.dist)[0]
          setNearestMeeqat(nearest)
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
      latitudeDelta: 1,
      longitudeDelta: 1,
    }, 500)
  }

  const haramPolygonCoords = HARAM_POLYGON.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{ latitude: 22.5, longitude: 40.0, latitudeDelta: 8, longitudeDelta: 8 }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Makkah marker */}
        <Marker coordinate={{ latitude: MAKKAH[0], longitude: MAKKAH[1] }} title="Makkah al-Mukarramah" />

        {/* Meeqat markers */}
        {MEEQAT_POINTS.map(point => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.lat, longitude: point.lng }}
            title={point.name.split(' (')[0]}
            description={`${point.distance} from Makkah · ${point.forPilgrims}`}
            pinColor={point.color}
          />
        ))}

        {/* Haram boundary polygon */}
        <Polygon
          coordinates={haramPolygonCoords}
          strokeColor="#16a34a"
          strokeWidth={3}
          fillColor="rgba(34, 197, 94, 0.15)"
        />
      </MapView>

      {/* Status banner */}
      <View style={[styles.banner, insideHaram && styles.bannerHaram]}>
        {insideHaram ? (
          <Text style={styles.bannerText}>You are inside the Haram boundary</Text>
        ) : nearestMeeqat ? (
          <Text style={styles.bannerText}>
            Nearest Meeqat: {nearestMeeqat.name} · {Math.round(nearestMeeqat.dist)} km
          </Text>
        ) : (
          <Text style={styles.bannerText}>Locating…</Text>
        )}
      </View>

      {/* Center on user button */}
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
})
