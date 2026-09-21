import { FidyahTier } from '../data/fidyah'
import { TranslationKey } from '../i18n/translations'
import { FidyahResult } from './fidyahCalculator'

/**
 * Tracking of fidyah as it is fulfilled. Pure functions, no I/O.
 *
 * Each obligation is one fidyah owed. The pilgrim picks how to fulfill it
 * (where the rules give a choice), which sets a number of steps — days
 * fasted, poor people fed, animals slaughtered — and ticks them off until
 * none remain.
 */

/** Every tier but the marriage contract, which owes no fidyah. */
export type FulfillTier = Exclude<FidyahTier, 'marriage'>

export interface FulfillOption {
  id: string
  labelKey: TranslationKey
  /** Steps to tick off; null when the pilgrim enters it (an amount worked out from a value). */
  units: number | null
  promptKey?: TranslationKey
}

const sacrifice: FulfillOption = { id: 'sacrifice', labelKey: 'fulfillOptSacrifice', units: 1 }
const foodValue: FulfillOption = { id: 'foodValue', labelKey: 'fulfillOptFoodValue', units: null, promptKey: 'fulfillPromptMudd' }
const fastValue: FulfillOption = { id: 'fastValue', labelKey: 'fulfillOptFastValue', units: null, promptKey: 'fulfillPromptDays' }

/**
 * The ways each fidyah can be fulfilled, in the order the rules list them
 * (Hashiyat al-Bajuri, Tuhfat and Nihayat al-Muhtaj).
 */
export const FULFILL_OPTIONS: Record<FulfillTier, FulfillOption[]> = {
  full: [sacrifice, { id: 'fast10', labelKey: 'fulfillOptFast10', units: 10 }],
  choice: [
    sacrifice,
    { id: 'fast3', labelKey: 'fulfillOptFast3', units: 3 },
    { id: 'feed6', labelKey: 'fulfillOptFeed6', units: 6 },
  ],
  partial: [{ id: 'mudd', labelKey: 'fulfillOptMudd', units: null }],
  severe: [
    { id: 'camel', labelKey: 'fulfillOptCamel', units: 1 },
    { id: 'cow', labelKey: 'fulfillOptCow', units: 1 },
    { id: 'sheep7', labelKey: 'fulfillOptSheep7', units: 7 },
    foodValue,
    fastValue,
  ],
  hunting: [{ id: 'animal', labelKey: 'fulfillOptHuntAnimal', units: 1 }, foodValue, fastValue],
  ihsar: [sacrifice, foodValue, fastValue],
}

/** Tiers whose options must be tried in order rather than freely chosen. */
export const ORDERED_TIERS: readonly FulfillTier[] = ['full', 'severe', 'ihsar']

/** Tiers a pilgrim can add by hand, in display order. */
export const MANUAL_TIERS: readonly FulfillTier[] = ['full', 'choice', 'partial', 'severe', 'hunting', 'ihsar']

export const MAX_MANUAL_COUNT = 50

export interface FulfillObligation {
  id: string
  tier: FulfillTier
  /** The FIDYAH_ITEMS id this came from, when it came from the calculator. */
  sourceId: string | null
  /** null until the pilgrim picks how to fulfill it. */
  optionId: string | null
  total: number
  remaining: number
}

let sequence = 0
const newId = () => `${Date.now().toString(36)}-${(sequence++).toString(36)}`

const isFulfillTier = (tier: string): tier is FulfillTier => tier in FULFILL_OPTIONS

function unchosen(tier: FulfillTier, sourceId: string | null): FulfillObligation {
  return { id: newId(), tier, sourceId, optionId: null, total: 0, remaining: 0 }
}

/** Mudds are simply counted, so they start with their method and total already set. */
function muddObligation(count: number): FulfillObligation {
  return { id: newId(), tier: 'partial', sourceId: null, optionId: 'mudd', total: count, remaining: count }
}

/** Turns the calculator's summary into things to fulfill. Mudds merge into one; the rest stay separate. */
export function obligationsFromResults(results: FidyahResult[]): FulfillObligation[] {
  return results.flatMap(({ tier, count, itemIds }) => {
    if (!isFulfillTier(tier)) return []
    if (tier === 'partial') return [muddObligation(count)]
    return itemIds.map(id => unchosen(tier, id))
  })
}

/** A fidyah added by hand: `count` separate ones, or `count` mudd for the partial tier. */
export function obligationsFromManual(tier: FulfillTier, count: number): FulfillObligation[] {
  const n = Math.min(Math.max(0, Math.floor(count) || 0), MAX_MANUAL_COUNT)
  if (n === 0) return []
  if (tier === 'partial') return [muddObligation(n)]
  return Array.from({ length: n }, () => unchosen(tier, null))
}

/** Picks how to fulfill it. `customUnits` is needed only for options with no fixed number of steps. */
export function chooseOption(ob: FulfillObligation, optionId: string, customUnits?: number): FulfillObligation {
  const option = FULFILL_OPTIONS[ob.tier].find(o => o.id === optionId)
  if (!option) return ob
  const units = option.units ?? Math.floor(customUnits ?? 0)
  if (!(units >= 1)) return ob
  return { ...ob, optionId, total: units, remaining: units }
}

/** The method can only be changed before any progress is made, and never for mudds. */
export function canChangeOption(ob: FulfillObligation): boolean {
  return ob.tier !== 'partial' && ob.optionId !== null && ob.remaining === ob.total
}

export function resetOption(ob: FulfillObligation): FulfillObligation {
  return canChangeOption(ob) ? { ...ob, optionId: null, total: 0, remaining: 0 } : ob
}

export function tick(ob: FulfillObligation): FulfillObligation {
  return { ...ob, remaining: Math.max(0, ob.remaining - 1) }
}

export function untick(ob: FulfillObligation): FulfillObligation {
  return { ...ob, remaining: Math.min(ob.total, ob.remaining + 1) }
}

export function isComplete(ob: FulfillObligation): boolean {
  return ob.optionId !== null && ob.remaining === 0
}

export function progressSummary(obs: FulfillObligation[]): { done: number; total: number } {
  return { done: obs.filter(isComplete).length, total: obs.length }
}

const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0

function parseObligation(entry: unknown): FulfillObligation | null {
  if (!entry || typeof entry !== 'object') return null
  const { id, tier, sourceId, optionId, total, remaining } = entry as Record<string, unknown>
  if (typeof id !== 'string' || typeof tier !== 'string' || !isFulfillTier(tier)) return null
  if (!isCount(total) || !isCount(remaining) || remaining > total) return null
  if (sourceId !== null && typeof sourceId !== 'string') return null
  const knownOption = typeof optionId === 'string' && FULFILL_OPTIONS[tier].some(o => o.id === optionId)
  if (optionId !== null && !knownOption) return null
  if ((optionId === null) !== (total === 0)) return null
  return { id, tier, sourceId, optionId, total, remaining }
}

/** Reads stored obligations, dropping anything malformed instead of failing. */
export function parseObligations(raw: string | null): FulfillObligation[] {
  if (!raw) return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []
  return data.flatMap(entry => parseObligation(entry) ?? [])
}
