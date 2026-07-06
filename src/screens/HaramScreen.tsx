import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { HARAM_POLYGON } from '../data/haram'
import { MAKKAH } from '../data/meeqat'
import { isInsidePolygon } from '../utils/geo'

const HARAM_COORDS = HARAM_POLYGON.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))

export default function HaramScreen() {
  const mapRef = useRef<MapView>(null)
  const [insideHaram, setInsideHaram] = useState(false)
  const [hasLocation, setHasLocation] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50 },
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
          title="Masjid al-Haram"
          description="Center of the Haram sanctuary"
        />

        {/* Haram boundary polygon */}
        <Polygon
          coordinates={HARAM_COORDS}
          strokeColor="#16a34a"
          strokeWidth={3}
          fillColor="rgba(34, 197, 94, 0.15)"
        />
      </MapView>

      {/* Status banner */}
      <View style={[styles.banner, insideHaram ? styles.bannerInside : styles.bannerOutside]}>
        {!hasLocation ? (
          <Text style={styles.bannerText}>Locating…</Text>
        ) : insideHaram ? (
          <Text style={styles.bannerText}>You are inside the Haram boundary</Text>
        ) : (
          <Text style={styles.bannerText}>You are outside the Haram boundary</Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.btnGroup}>
        <TouchableOpacity style={styles.btn} onPress={centerOnHaram}>
          <Text style={styles.btnText}>🕋 Makkah</Text>
        </TouchableOpacity>
        {hasLocation && (
          <TouchableOpacity style={styles.btn} onPress={centerOnUser}>
            <Text style={styles.btnText}>⊕ My Location</Text>
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
})
