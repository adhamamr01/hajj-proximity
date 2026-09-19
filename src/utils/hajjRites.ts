import { Ritual } from '../data/fidyah'

/**
 * Fidyah rules for the Hajj rites that depend on each other — the nights in
 * Mina and the stoning. Pure functions, no I/O.
 *
 * Sources (Shafi'i): Tuhfat al-Muhtaj and Nihayat al-Muhtaj, chapter on the
 * nights of Tashreeq (early departure is valid only for one who stayed the
 * first two nights); Hashiyat al-Bajuri (three or more pebbles is a dam);
 * al-Nawawi's al-Majmu' via Islamweb fatwa 13630 (one mudd per pebble below
 * three). Nights: a mudd per night missed, a dam for all three.
 */

/** Most pebbles that can be missed on each stoning day. */
export const PEBBLE_LIMITS = {
  nahr: 7, // Jamrat al-Aqaba on the Day of Nahr
  tashreeq1: 21, // 3 jamarat x 7
  tashreeq2: 21,
  tashreeq3: 21,
} as const

export type StoningDay = keyof typeof PEBBLE_LIMITS
export type PebblesMissed = Record<StoningDay, number>

export interface MinaInput {
  missedNight1: boolean
  missedNight2: boolean
  /** Ignored when the pilgrim left early — there is no third night then. */
  missedNight3: boolean
  /** Left Mina on the 12th before sunset (the first nafr). */
  leftEarly: boolean
}

export interface MinaStatus {
  /** Early departure only counts for one who stayed the first two nights. */
  validEarlyDeparture: boolean
  /** The third night counts as missed: left early invalidly, or stayed on but skipped it. */
  thirdNightMissed: boolean
  missedNights: number
  /** Without a valid early departure the 13th-day stoning is still owed. */
  thirdDayStoningRequired: boolean
}

export function minaStatus(mina: MinaInput): MinaStatus {
  const validEarlyDeparture = mina.leftEarly && !mina.missedNight1 && !mina.missedNight2
  const thirdNightMissed = mina.leftEarly ? !validEarlyDeparture : mina.missedNight3
  const missedNights =
    Number(mina.missedNight1) + Number(mina.missedNight2) + Number(thirdNightMissed)
  return {
    validEarlyDeparture,
    thirdNightMissed,
    missedNights,
    thirdDayStoningRequired: !validEarlyDeparture,
  }
}

/** A mudd per night missed; missing all three nights is one dam instead. */
export function minaFidyahIds(mina: MinaInput): string[] {
  const { missedNights } = minaStatus(mina)
  if (missedNights === 0) return []
  if (missedNights >= 3) return ['mina_all_missed']
  return new Array<string>(missedNights).fill('mina_partial_missed')
}

const clamp = (n: number, max: number) => Math.min(Math.max(0, Math.floor(n) || 0), max)

/**
 * Pebbles missed and not made up, across all days. If the pilgrim left early
 * without a valid early departure, the whole 13th-day stoning was missed.
 */
export function totalPebblesMissed(pebbles: PebblesMissed, mina: MinaInput): number {
  const third = mina.leftEarly
    ? minaStatus(mina).thirdDayStoningRequired
      ? PEBBLE_LIMITS.tashreeq3
      : 0
    : clamp(pebbles.tashreeq3, PEBBLE_LIMITS.tashreeq3)
  return (
    clamp(pebbles.nahr, PEBBLE_LIMITS.nahr) +
    clamp(pebbles.tashreeq1, PEBBLE_LIMITS.tashreeq1) +
    clamp(pebbles.tashreeq2, PEBBLE_LIMITS.tashreeq2) +
    third
  )
}

/** A mudd per pebble for one or two; three or more is one dam. */
export function ramyFidyahIds(totalMissed: number): string[] {
  if (totalMissed <= 0) return []
  if (totalMissed >= 3) return ['ramy_dam']
  return new Array<string>(totalMissed).fill('ramy_partial')
}

export interface RiteInput {
  ritual: Ritual
  meeqatCrossed: boolean
  muzdalifahMissed: boolean
  mina: MinaInput
  pebbles: PebblesMissed
}

/** Fidyah item ids owed for the rites — feed these to calculateFidyah. */
export function riteFidyahIds(input: RiteInput): string[] {
  const ids: string[] = []
  if (input.meeqatCrossed) ids.push('meeqat_crossed')
  if (input.ritual === 'hajj') {
    if (input.muzdalifahMissed) ids.push('muzdalifah_missed')
    ids.push(...minaFidyahIds(input.mina))
    ids.push(...ramyFidyahIds(totalPebblesMissed(input.pebbles, input.mina)))
  }
  return ids
}
