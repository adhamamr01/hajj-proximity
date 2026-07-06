import { Paths } from 'expo-file-system'

// Esri World Street Map — free, no API key, works in mobile apps.
// Note: Esri uses {z}/{y}/{x} row/column order, not the standard {z}/{x}/{y}.
export const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'

export const TILE_ATTRIBUTION = 'Tiles © Esri'

// The map only ever shows Makkah, the 5 Meeqat points, and the Haram boundary —
// a small fixed set of regions, so tiles rarely change and are safe to cache
// on disk for a long time. This avoids re-fetching from Esri on every visit.
export const TILE_CACHE_PATH = Paths.cache.uri
export const TILE_CACHE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days
