const R_EARTH = 6371

function toRad(deg: number) { return (deg * Math.PI) / 180 }

/** Straight-line distance in km between two lat/lng points (haversine). */
export function distKm(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.sqrt(h))
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
