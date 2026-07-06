import { distKm, bearingTo, destPoint, midBearing, arcPoints, isInsidePolygon } from './geo'

describe('distKm', () => {
  it('returns 0 for identical points', () => {
    expect(distKm([21.4225, 39.8262], [21.4225, 39.8262])).toBe(0)
  })

  it('Dhul Hulayfah to Makkah is ~335 km', () => {
    const dist = distKm([24.41406002656528, 39.54286561840277], [21.4225, 39.8262])
    expect(dist).toBeCloseTo(335, -2) // within 50 km
  })

  it('is symmetric', () => {
    const a: [number, number] = [21.4225, 39.8262]
    const b: [number, number] = [24.4209, 39.5192]
    expect(distKm(a, b)).toBeCloseTo(distKm(b, a), 6)
  })
})

describe('bearingTo', () => {
  it('due north is 0°', () => {
    const bearing = bearingTo([0, 0], [1, 0])
    expect(bearing).toBeCloseTo(0, 0)
  })

  it('due east is 90°', () => {
    const bearing = bearingTo([0, 0], [0, 1])
    expect(bearing).toBeCloseTo(90, 0)
  })

  it('due south is 180°', () => {
    const bearing = bearingTo([1, 0], [0, 0])
    expect(bearing).toBeCloseTo(180, 0)
  })

  it('due west is 270°', () => {
    const bearing = bearingTo([0, 1], [0, 0])
    expect(bearing).toBeCloseTo(270, 0)
  })

  it('returns value in [0, 360)', () => {
    const b = bearingTo([21.4225, 39.8262], [24.4209, 39.5192])
    expect(b).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThan(360)
  })
})

describe('destPoint', () => {
  it('travelling 0 km returns the origin', () => {
    const [lat, lng] = destPoint([21.4225, 39.8262], 45, 0)
    expect(lat).toBeCloseTo(21.4225, 4)
    expect(lng).toBeCloseTo(39.8262, 4)
  })

  it('round-trips with bearingTo and distKm', () => {
    const origin: [number, number] = [21.4225, 39.8262]
    const bearing = 45
    const km = 100
    const dest = destPoint(origin, bearing, km)
    expect(distKm(origin, dest)).toBeCloseTo(km, 0)
    expect(bearingTo(origin, dest)).toBeCloseTo(bearing, 0)
  })
})

describe('midBearing', () => {
  it('midpoint of 0° and 90° is 45°', () => {
    expect(midBearing(0, 90)).toBeCloseTo(45, 5)
  })

  it('midpoint of 270° and 90° wraps clockwise to 0°', () => {
    // Going clockwise from 270 to 90 crosses 360/0
    expect(midBearing(270, 90)).toBeCloseTo(0, 5)
  })

  it('midpoint of 350° and 10° is 0°', () => {
    expect(midBearing(350, 10)).toBeCloseTo(0, 5)
  })
})

describe('arcPoints', () => {
  it('returns steps+1 points', () => {
    const pts = arcPoints([21.4225, 39.8262], 100, 0, 90, 10)
    expect(pts).toHaveLength(11)
  })

  it('first point is at the start bearing', () => {
    const center: [number, number] = [21.4225, 39.8262]
    const pts = arcPoints(center, 100, 0, 90, 10)
    const expectedStart = destPoint(center, 0, 100)
    expect(pts[0][0]).toBeCloseTo(expectedStart[0], 4)
    expect(pts[0][1]).toBeCloseTo(expectedStart[1], 4)
  })

  it('last point is at the end bearing', () => {
    const center: [number, number] = [21.4225, 39.8262]
    const pts = arcPoints(center, 100, 0, 90, 10)
    const expectedEnd = destPoint(center, 90, 100)
    expect(pts[pts.length - 1][0]).toBeCloseTo(expectedEnd[0], 4)
    expect(pts[pts.length - 1][1]).toBeCloseTo(expectedEnd[1], 4)
  })

  it('all points are approximately the correct radius from center', () => {
    const center: [number, number] = [21.4225, 39.8262]
    const radius = 200
    const pts = arcPoints(center, radius, 30, 150, 20)
    for (const pt of pts) {
      expect(distKm(center, pt)).toBeCloseTo(radius, 0)
    }
  })
})

describe('isInsidePolygon', () => {
  // Simple square: (0,0) → (0,2) → (2,2) → (2,0)
  const square: [number, number][] = [[0, 0], [0, 2], [2, 2], [2, 0]]

  it('center point is inside', () => {
    expect(isInsidePolygon([1, 1], square)).toBe(true)
  })

  it('point outside is not inside', () => {
    expect(isInsidePolygon([3, 3], square)).toBe(false)
  })

  it('point far outside is not inside', () => {
    expect(isInsidePolygon([-10, -10], square)).toBe(false)
  })

  it('works with a concave shape', () => {
    // L-shape: a point in the notch should be outside
    const lShape: [number, number][] = [
      [0, 0], [0, 4], [2, 4], [2, 2], [4, 2], [4, 0]
    ]
    expect(isInsidePolygon([3, 3], lShape)).toBe(false) // in the notch
    expect(isInsidePolygon([1, 3], lShape)).toBe(true)  // inside the L
  })
})
