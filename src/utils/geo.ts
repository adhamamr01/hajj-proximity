const R_EARTH = 6371

function toRad(deg: number) { return (deg * Math.PI) / 180 }
function toDeg(rad: number) { return (rad * 180) / Math.PI }

/** Straight-line distance in km between two lat/lng points (haversine). */
export function distKm(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.sqrt(h))
}

/** Compass bearing (0–360°) from point a to point b. */
export function bearingTo(a: [number, number], b: [number, number]): number {
  const lat1 = toRad(a[0]), lat2 = toRad(b[0])
  const dLng = toRad(b[1] - a[1])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Destination point when travelling `km` kilometres from `origin` on `bearingDeg`. */
export function destPoint(
  origin: [number, number],
  bearingDeg: number,
  km: number,
): [number, number] {
  const lat1 = toRad(origin[0])
  const lng1 = toRad(origin[1])
  const b = toRad(bearingDeg)
  const d = km / R_EARTH
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b),
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    )
  return [toDeg(lat2), toDeg(lng2)]
}

/** Bearing halfway between a and b, always going clockwise from a. */
export function midBearing(a: number, b: number): number {
  let end = b
  while (end < a) end += 360
  return ((a + end) / 2) % 360
}

/**
 * Array of lat/lng points tracing an arc at `radiusKm` from `center`,
 * sweeping clockwise from `startBearing` to `endBearing`.
 */
export function arcPoints(
  center: [number, number],
  radiusKm: number,
  startBearing: number,
  endBearing: number,
  steps = 80,
): [number, number][] {
  let end = endBearing
  while (end <= startBearing) end += 360
  return Array.from({ length: steps + 1 }, (_, i) => {
    const b = startBearing + ((end - startBearing) * i) / steps
    return destPoint(center, b, radiusKm)
  })
}

/**
 * Ray-casting point-in-polygon test.
 * Returns true if [lat, lng] is inside the given polygon.
 */
export function isInsidePolygon(
  point: [number, number],
  polygon: [number, number][],
): boolean {
  const [py, px] = point
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [iy, ix] = polygon[i]
    const [jy, jx] = polygon[j]
    const intersects =
      iy > py !== jy > py && px < ((jx - ix) * (py - iy)) / (jy - iy) + ix
    if (intersects) inside = !inside
  }
  return inside
}
