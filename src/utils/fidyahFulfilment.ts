import { FidyahTier } from '../data/fidyah'
import { TranslationKey } from '../i18n/translations'
import { FidyahResult } from './fidyahCalculator'

/**
 * Tracking of fidyah as it is fulfilled. Pure functions, no I/O.
 *
 * Each obligation is one fidyah owed. The pilgrim picks how to fulfil it
 * (where the rules give a choice), which sets a number of steps — days
 * fasted, poor people fed, animals slaughtered — and ticks them off until
 * none remain.
 */

/** Every tier but the marriage contract, which owes no fidyah. */
export type FulfilTier = Exclude<FidyahTier, 'marriage'>

export interface FulfilOption {
  id: string
  labelKey: TranslationKey
  /** Steps to tick off; null when the pilgrim enters it (an amount worked out from a value). */
  units: number | null
  promptKey?: TranslationKey
}

const sacrifice: FulfilOption = { id: 'sacrifice', labelKey: 'fulfilOptSacrifice', units: 1 }
const foodValue: FulfilOption = { id: 'foodValue', labelKey: 'fulfilOptFoodValue', units: null, promptKey: 'fulfilPromptMudd' }
const fastValue: FulfilOption = { id: 'fastValue', labelKey: 'fulfilOptFastValue', units: null, promptKey: 'fulfilPromptDays' }

/**
 * The ways each fidyah can be fulfilled, in the order the rules list them
 * (Hashiyat al-Bajuri, Tuhfat and Nihayat al-Muhtaj).
 */
export const FULFIL_OPTIONS: Record<FulfilTier, FulfilOption[]> = {
  full: [sacrifice, { id: 'fast10', labelKey: 'fulfilOptFast10', units: 10 }],
  choice: [
    sacrifice,
    { id: 'fast3', labelKey: 'fulfilOptFast3', units: 3 },
    { id: 'feed6', labelKey: 'fulfilOptFeed6', units: 6 },
  ],
  partial: [{ id: 'mudd', labelKey: 'fulfilOptMudd', units: null }],
  severe: [
    { id: 'camel', labelKey: 'fulfilOptCamel', units: 1 },
    { id: 'cow', labelKey: 'fulfilOptCow', units: 1 },
    { id: 'sheep7', labelKey: 'fulfilOptSheep7', units: 7 },
    foodValue,
    fastValue,
  ],
  hunting: [{ id: 'animal', labelKey: 'fulfilOptHuntAnimal', units: 1 }, foodValue, fastValue],
  ihsar: [sacrifice, foodValue, fastValue],
}

/** Tiers whose options must be tried in order rather than freely chosen. */
export const ORDERED_TIERS: readonly FulfilTier[] = ['full', 'severe', 'ihsar']

/** Tiers a pilgrim can add by hand, in display order. */
export const MANUAL_TIERS: readonly FulfilTier[] = ['full', 'choice', 'partial', 'severe', 'hunting', 'ihsar']

export const MAX_MANUAL_COUNT = 50

export interface FulfilObligation {
  id: string
  tier: FulfilTier
  /** The FIDYAH_ITEMS id this came from, when it came from the calculator. */
  sourceId: string | null
  /** null until the pilgrim picks how to fulfil it. */
  optionId: string | null
  total: number
  remaining: number
}

let sequence = 0
const newId = () => `${Date.now().toString(36)}-${(sequence++).toString(36)}`

const isFulfilTier = (tier: string): tier is FulfilTier => tier in FULFIL_OPTIONS

function unchosen(tier: FulfilTier, sourceId: string | null): FulfilObligation {
  return { id: newId(), tier, sourceId, optionId: null, total: 0, remaining: 0 }
}

/** Mudds are simply counted, so they start with their method and total already set. */
function muddObligation(count: number): FulfilObligation {
  return { id: newId(), tier: 'partial', sourceId: null, optionId: 'mudd', total: count, remaining: count }
}

/** Turns the calculator's summary into things to fulfil. Mudds merge into one; the rest stay separate. */
export function obligationsFromResults(results: FidyahResult[]): FulfilObligation[] {
  return results.flatMap(({ tier, count, itemIds }) => {
    if (!isFulfilTier(tier)) return []
    if (tier === 'partial') return [muddObligation(count)]
    return itemIds.map(id => unchosen(tier, id))
  })
}

/** A fidyah added by hand: `count` separate ones, or `count` mudd for the partial tier. */
export function obligationsFromManual(tier: FulfilTier, count: number): FulfilObligation[] {
  const n = Math.min(Math.max(0, Math.floor(count) || 0), MAX_MANUAL_COUNT)
  if (n === 0) return []
  if (tier === 'partial') return [muddObligation(n)]
  return Array.from({ length: n }, () => unchosen(tier, null))
}

/** Picks how to fulfil it. `customUnits` is needed only for options with no fixed number of steps. */
export function chooseOption(ob: FulfilObligation, optionId: string, customUnits?: number): FulfilObligation {
  const option = FULFIL_OPTIONS[ob.tier].find(o => o.id === optionId)
  if (!option) return ob
  const units = option.units ?? Math.floor(customUnits ?? 0)
  if (!(units >= 1)) return ob
  return { ...ob, optionId, total: units, remaining: units }
}

/** The method can only be changed before any progress is made, and never for mudds. */
export function canChangeOption(ob: FulfilObligation): boolean {
  return ob.tier !== 'partial' && ob.optionId !== null && ob.remaining === ob.total
}

export function resetOption(ob: FulfilObligation): FulfilObligation {
  return canChangeOption(ob) ? { ...ob, optionId: null, total: 0, remaining: 0 } : ob
}

export function tick(ob: FulfilObligation): FulfilObligation {
  return { ...ob, remaining: Math.max(0, ob.remaining - 1) }
}

export function untick(ob: FulfilObligation): FulfilObligation {
  return { ...ob, remaining: Math.min(ob.total, ob.remaining + 1) }
}

export function isComplete(ob: FulfilObligation): boolean {
  return ob.optionId !== null && ob.remaining === 0
}

export function progressSummary(obs: FulfilObligation[]): { done: number; total: number } {
  return { done: obs.filter(isComplete).length, total: obs.length }
}

const isCount = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0

function parseObligation(entry: unknown): FulfilObligation | null {
  if (!entry || typeof entry !== 'object') return null
  const { id, tier, sourceId, optionId, total, remaining } = entry as Record<string, unknown>
  if (typeof id !== 'string' || typeof tier !== 'string' || !isFulfilTier(tier)) return null
  if (!isCount(total) || !isCount(remaining) || remaining > total) return null
  if (sourceId !== null && typeof sourceId !== 'string') return null
  const knownOption = typeof optionId === 'string' && FULFIL_OPTIONS[tier].some(o => o.id === optionId)
  if (optionId !== null && !knownOption) return null
  if ((optionId === null) !== (total === 0)) return null
  return { id, tier, sourceId, optionId, total, remaining }
}

/** Reads stored obligations, dropping anything malformed instead of failing. */
export function parseObligations(raw: string | null): FulfilObligation[] {
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
