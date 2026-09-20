import { FIDYAH_ITEMS, FidyahTier } from '../data/fidyah'

export interface FidyahResult {
  tier: FidyahTier
  count: number
  itemIds: string[]
}

/**
 * Pure calculation: given the set of violation/omission ids the user
 * selected, groups them by expiation tier. The fidyah repeats once per
 * selected item — including repeats of the *same* item, since committing
 * the same violation on different days/occasions each incurs its own
 * fidyah (per the source rule: "تتكرر الفدية بتكرر المحرم المقترف... وبتكرر
 * النسك المتروك"). To capture a repeat, the same id can appear more than
 * once in selectedItemIds.
 */
/**
 * Expands per-item repeat counts into the id list calculateFidyah expects.
 * An item that can only happen once (marriage contract, Ihsar, the first
 * intercourse) counts at most once however many times it is passed in.
 */
export function expandCounts(counts: Record<string, number>): string[] {
  const itemsById = new Map(FIDYAH_ITEMS.map(item => [item.id, item]))
  return Object.entries(counts).flatMap(([id, n]) => {
    const item = itemsById.get(id)
    if (!item) return []
    const times = Math.min(Math.max(0, Math.floor(n) || 0), item.once ? 1 : Infinity)
    return new Array<string>(times).fill(id)
  })
}

export function calculateFidyah(selectedItemIds: string[]): FidyahResult[] {
  const itemsById = new Map(FIDYAH_ITEMS.map(item => [item.id, item]))
  const byTier = new Map<FidyahTier, string[]>()

  for (const id of selectedItemIds) {
    const item = itemsById.get(id)
    if (!item) continue
    const list = byTier.get(item.tier) ?? []
    list.push(id)
    byTier.set(item.tier, list)
  }

  return Array.from(byTier.entries()).map(([tier, itemIds]) => ({
    tier,
    count: itemIds.length,
    itemIds,
  }))
}
