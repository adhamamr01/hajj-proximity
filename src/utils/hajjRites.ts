import { Ritual } from '../data/fidyah'

/**
 * Fidyah rules for the Hajj rites that depend on each other — the nights in
 * Mina and the stoning. Pure functions, no I/O.
 *
 * Nights: a mudd per night missed, a dam for all three. A pilgrim who leaves
 * on the 12th owes nothing for the third night or the 13th-day stoning.
 * (Tuhfat/Nihayat al-Muhtaj call an early departure invalid after a missed
 * night; the app owner chose to drop that condition.)
 *
 * Stoning: a mudd per jamrah's worth of pebbles missed (7 pebbles), so 1-7
 * is one mudd and 8-14 is two; more than 14 is a dam. This is the app
 * owner's rule — Hashiyat al-Bajuri instead makes three pebbles a dam.
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
  /** Only counts when the pilgrim stayed on past the 12th. */
  thirdNightMissed: boolean
  missedNights: number
  /** Leaving on the 12th drops the third night and the 13th-day stoning. */
  thirdDayStoningRequired: boolean
}

export function minaStatus(mina: MinaInput): MinaStatus {
  const thirdNightMissed = !mina.leftEarly && mina.missedNight3
  const missedNights =
    Number(mina.missedNight1) + Number(mina.missedNight2) + Number(thirdNightMissed)
  return { thirdNightMissed, missedNights, thirdDayStoningRequired: !mina.leftEarly }
}

/** A mudd per night missed; missing all three nights is one dam instead. */
export function minaFidyahIds(mina: MinaInput): string[] {
  const { missedNights } = minaStatus(mina)
  if (missedNights === 0) return []
  if (missedNights >= 3) return ['mina_all_missed']
  return new Array<string>(missedNights).fill('mina_partial_missed')
}

const clamp = (n: number, max: number) => Math.min(Math.max(0, Math.floor(n) || 0), max)

/** Pebbles missed and not made up, across all days. */
export function totalPebblesMissed(pebbles: PebblesMissed, mina: MinaInput): number {
  const third = minaStatus(mina).thirdDayStoningRequired
    ? clamp(pebbles.tashreeq3, PEBBLE_LIMITS.tashreeq3)
    : 0
  return (
    clamp(pebbles.nahr, PEBBLE_LIMITS.nahr) +
    clamp(pebbles.tashreeq1, PEBBLE_LIMITS.tashreeq1) +
    clamp(pebbles.tashreeq2, PEBBLE_LIMITS.tashreeq2) +
    third
  )
}

/** Pebbles in one jamrah — each 7 missed (or part of 7) is one mudd. */
export const PEBBLES_PER_MUDD = 7
/** More than this many pebbles missed is a dam instead of mudds. */
export const MAX_MUDD_PEBBLES = 2 * PEBBLES_PER_MUDD

export function ramyFidyahIds(totalMissed: number): string[] {
  if (totalMissed <= 0) return []
  if (totalMissed > MAX_MUDD_PEBBLES) return ['ramy_dam']
  return new Array<string>(Math.ceil(totalMissed / PEBBLES_PER_MUDD)).fill('ramy_partial')
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
