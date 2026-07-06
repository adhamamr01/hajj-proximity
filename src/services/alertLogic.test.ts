import { evaluateLocationUpdate, AlertState } from './alertLogic'
import { MEEQAT_POINTS, MAKKAH } from '../data/meeqat'
import { HARAM_POLYGON } from '../data/haram'
import { destPoint, bearingTo, distKm } from '../utils/geo'

const emptyState: AlertState = { alertedMeeqatIds: [], haramStatus: null }
const defaultSettings = { thresholdKm: 20, meeqatAlertsOn: true, haramAlertsOn: true }

describe('evaluateLocationUpdate — Meeqat proximity', () => {
  it('does not alert when far from every Meeqat', () => {
    const farAway: [number, number] = [10, 10] // nowhere near Makkah
    const result = evaluateLocationUpdate(farAway, MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, emptyState)
    expect(result.meeqatAlerts).toHaveLength(0)
  })

  it('alerts once when within threshold of a Meeqat', () => {
    const yalamlam = MEEQAT_POINTS.find(m => m.id === 'yalamlam')!
    const nearYalamlam = destPoint([yalamlam.lat, yalamlam.lng], 0, 5) // 5 km north of it
    const result = evaluateLocationUpdate(nearYalamlam, MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, emptyState)

    expect(result.meeqatAlerts).toHaveLength(1)
    expect(result.meeqatAlerts[0].meeqatId).toBe('yalamlam')
    expect(result.nextState.alertedMeeqatIds).toContain('yalamlam')
  })

  it('does not re-alert for a Meeqat already in the alerted state', () => {
    const yalamlam = MEEQAT_POINTS.find(m => m.id === 'yalamlam')!
    const nearYalamlam = destPoint([yalamlam.lat, yalamlam.lng], 0, 5)
    const state: AlertState = { alertedMeeqatIds: ['yalamlam'], haramStatus: null }

    const result = evaluateLocationUpdate(nearYalamlam, MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, state)
    expect(result.meeqatAlerts).toHaveLength(0)
  })

  it('respects the meeqatAlertsOn toggle', () => {
    const yalamlam = MEEQAT_POINTS.find(m => m.id === 'yalamlam')!
    const nearYalamlam = destPoint([yalamlam.lat, yalamlam.lng], 0, 5)
    const settings = { ...defaultSettings, meeqatAlertsOn: false }

    const result = evaluateLocationUpdate(nearYalamlam, MEEQAT_POINTS, HARAM_POLYGON, settings, emptyState)
    expect(result.meeqatAlerts).toHaveLength(0)
    expect(result.nextState.alertedMeeqatIds).toEqual([])
  })

  it('can alert for multiple Meeqats independently across updates', () => {
    let state = emptyState
    const qarn = MEEQAT_POINTS.find(m => m.id === 'qarn-al-manazil')!
    const dhat = MEEQAT_POINTS.find(m => m.id === 'dhat-irq')!

    const r1 = evaluateLocationUpdate(destPoint([qarn.lat, qarn.lng], 0, 5), MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, state)
    state = r1.nextState
    expect(r1.meeqatAlerts.map(a => a.meeqatId)).toEqual(['qarn-al-manazil'])

    const r2 = evaluateLocationUpdate(destPoint([dhat.lat, dhat.lng], 0, 5), MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, state)
    expect(r2.meeqatAlerts.map(a => a.meeqatId)).toEqual(['dhat-irq'])
    expect(r2.nextState.alertedMeeqatIds.sort()).toEqual(['dhat-irq', 'qarn-al-manazil'])
  })
})

describe('evaluateLocationUpdate — Haram boundary', () => {
  // A point well inside the polygon and one well outside, derived from the Haram center.
  const insidePoint: [number, number] = MAKKAH
  const outsidePoint: [number, number] = destPoint(MAKKAH, 0, 100) // 100 km north, outside Haram

  it('fires an "entered" event on first crossing into the Haram', () => {
    const result = evaluateLocationUpdate(insidePoint, MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, emptyState)
    expect(result.haramEvent).toBe('entered')
    expect(result.nextState.haramStatus).toBe('inside')
  })

  it('does not re-fire "entered" while remaining inside', () => {
    const state: AlertState = { alertedMeeqatIds: [], haramStatus: 'inside' }
    const result = evaluateLocationUpdate(insidePoint, MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, state)
    expect(result.haramEvent).toBeNull()
  })

  it('fires an "exited" event when moving from inside to outside', () => {
    const state: AlertState = { alertedMeeqatIds: [], haramStatus: 'inside' }
    const result = evaluateLocationUpdate(outsidePoint, MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, state)
    expect(result.haramEvent).toBe('exited')
    expect(result.nextState.haramStatus).toBe('outside')
  })

  it('does not fire "exited" on the very first update when starting outside (no prior state)', () => {
    const result = evaluateLocationUpdate(outsidePoint, MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, emptyState)
    expect(result.haramEvent).toBeNull()
    // No transition occurred, so status is left unset until the first crossing event.
    expect(result.nextState.haramStatus).toBeNull()
  })

  it('respects the haramAlertsOn toggle', () => {
    const settings = { ...defaultSettings, haramAlertsOn: false }
    const result = evaluateLocationUpdate(insidePoint, MEEQAT_POINTS, HARAM_POLYGON, settings, emptyState)
    expect(result.haramEvent).toBeNull()
    expect(result.nextState.haramStatus).toBeNull()
  })

  it('simulates a full route: approaching, entering, then exiting the Haram', () => {
    let state = emptyState
    const route: [number, number][] = [
      destPoint(MAKKAH, 0, 150), // far outside
      destPoint(MAKKAH, 0, 50),  // still outside, closer
      MAKKAH,                    // inside
      destPoint(MAKKAH, 0, 100), // back outside
    ]
    const events: (string | null)[] = []
    for (const pos of route) {
      const result = evaluateLocationUpdate(pos, MEEQAT_POINTS, HARAM_POLYGON, defaultSettings, state)
      events.push(result.haramEvent)
      state = result.nextState
    }
    expect(events).toEqual([null, null, 'entered', 'exited'])
  })
})

describe('evaluateLocationUpdate — sanity check on test fixtures', () => {
  it('the "outside" test point really is outside the Haram threshold distance used', () => {
    // Guards against a fixture regression: outsidePoint must be far enough
    // that isInsidePolygon returns false regardless of polygon updates.
    const outsidePoint = destPoint(MAKKAH, 0, 100)
    expect(distKm(MAKKAH, outsidePoint)).toBeGreaterThan(50)
    expect(bearingTo(MAKKAH, outsidePoint)).toBeCloseTo(0, 0)
  })
})
