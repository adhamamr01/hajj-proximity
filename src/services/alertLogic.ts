import { MeeqatPoint } from '../data/meeqat'
import { distKm, isInsidePolygon } from '../utils/geo'

export interface AlertSettings {
  thresholdKm: number
  meeqatAlertsOn: boolean
  haramAlertsOn: boolean
}

export interface AlertState {
  alertedMeeqatIds: string[]
  haramStatus: 'inside' | 'outside' | null
}

export interface MeeqatAlert {
  meeqatId: string
  meeqatName: string
  distKm: number
}

export interface EvaluationResult {
  meeqatAlerts: MeeqatAlert[]
  haramEvent: 'entered' | 'exited' | null
  nextState: AlertState
}

/**
 * Pure decision function for the background location task: given a position
 * and the current alert state, returns which alerts should fire and the
 * updated state. No I/O (no AsyncStorage, no notifications) so it can be
 * unit-tested by simulating a route without a device or background task.
 */
export function evaluateLocationUpdate(
  pos: [number, number],
  meeqatPoints: MeeqatPoint[],
  haramPolygon: [number, number][],
  settings: AlertSettings,
  state: AlertState,
): EvaluationResult {
  const meeqatAlerts: MeeqatAlert[] = []
  let alertedMeeqatIds = state.alertedMeeqatIds

  if (settings.meeqatAlertsOn) {
    for (const meeqat of meeqatPoints) {
      const dist = distKm(pos, [meeqat.lat, meeqat.lng])
      if (dist <= settings.thresholdKm && !alertedMeeqatIds.includes(meeqat.id)) {
        meeqatAlerts.push({ meeqatId: meeqat.id, meeqatName: meeqat.name, distKm: dist })
        alertedMeeqatIds = [...alertedMeeqatIds, meeqat.id]
      }
    }
  }

  let haramEvent: 'entered' | 'exited' | null = null
  let haramStatus = state.haramStatus

  if (settings.haramAlertsOn) {
    const insideNow = isInsidePolygon(pos, haramPolygon)
    const wasInside = state.haramStatus === 'inside'

    if (insideNow && !wasInside) {
      haramEvent = 'entered'
      haramStatus = 'inside'
    } else if (!insideNow && wasInside) {
      haramEvent = 'exited'
      haramStatus = 'outside'
    }
  }

  return {
    meeqatAlerts,
    haramEvent,
    nextState: { alertedMeeqatIds, haramStatus },
  }
}
