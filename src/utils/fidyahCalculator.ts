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
