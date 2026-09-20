import { calculateFidyah } from './fidyahCalculator'
import { FIDYAH_ITEMS, getFidyahItemsForRitual } from '../data/fidyah'

describe('calculateFidyah', () => {
  it('returns nothing for an empty selection', () => {
    expect(calculateFidyah([])).toEqual([])
  })

  it('groups a single prohibited-act violation under the free-choice fidyah', () => {
    const result = calculateFidyah(['perfume'])
    expect(result).toEqual([{ tier: 'choice', count: 1, itemIds: ['perfume'] }])
  })

  it('groups multiple different prohibited acts under one tier', () => {
    const result = calculateFidyah(['perfume', 'sewn_clothing', 'head_cover_men'])
    expect(result).toHaveLength(1)
    expect(result[0].tier).toBe('choice')
    expect(result[0].count).toBe(3)
  })

  it('separates the free-choice fidyah from the mudd tier', () => {
    const result = calculateFidyah(['hair_removal_full', 'nail_trim_partial'])
    expect(result.find(r => r.tier === 'choice')?.count).toBe(1)
    expect(result.find(r => r.tier === 'partial')?.count).toBe(1)
  })

  it('repeats the fidyah for the same violation committed multiple times', () => {
    // e.g. perfume applied on two separate occasions -> two fidyahs
    const result = calculateFidyah(['perfume', 'perfume'])
    expect(result).toEqual([{ tier: 'choice', count: 2, itemIds: ['perfume', 'perfume'] }])
  })

  it('never puts a prohibited act in the ordered missed-rite tier', () => {
    // The two are different fidyahs: a missed rite is sheep-then-fasting in
    // order; a prohibited act is a free choice of three. Mixing them shows
    // the wrong instructions.
    const wrong = FIDYAH_ITEMS.filter(i => i.category === 'act' && i.tier === 'full')
    expect(wrong).toEqual([])
    const rites = FIDYAH_ITEMS.filter(i => i.category === 'rite' && i.tier === 'choice')
    expect(rites).toEqual([])
  })

  it('routes hunting, marriage, ihsar, and severe cases to their own tiers', () => {
    const result = calculateFidyah(['hunting', 'marriage_contract', 'ihsar', 'intercourse_before_tahallul'])
    const tiers = result.map(r => r.tier).sort()
    expect(tiers).toEqual(['hunting', 'ihsar', 'marriage', 'severe'])
  })

  it('ignores unknown ids', () => {
    expect(calculateFidyah(['not-a-real-id'])).toEqual([])
  })
})

describe('getFidyahItemsForRitual', () => {
  it('excludes Hajj-only rite items (Muzdalifah, Mina, Ramy) from Umrah', () => {
    const umrahItems = getFidyahItemsForRitual('umrah')
    const hajjOnlyIds = ['muzdalifah_missed', 'mina_all_missed', 'mina_partial_missed', 'ramy_dam', 'ramy_partial']
    for (const id of hajjOnlyIds) {
      expect(umrahItems.some(i => i.id === id)).toBe(false)
    }
  })

  it('includes the single "intercourse" item for Umrah, not the before/after Tahallul split', () => {
    const umrahItems = getFidyahItemsForRitual('umrah')
    expect(umrahItems.some(i => i.id === 'intercourse_umrah')).toBe(true)
    expect(umrahItems.some(i => i.id === 'intercourse_before_tahallul')).toBe(false)
    expect(umrahItems.some(i => i.id === 'intercourse_after_tahallul')).toBe(false)
  })

  it('includes the before/after Tahallul split for Hajj, not the single Umrah item', () => {
    const hajjItems = getFidyahItemsForRitual('hajj')
    expect(hajjItems.some(i => i.id === 'intercourse_before_tahallul')).toBe(true)
    expect(hajjItems.some(i => i.id === 'intercourse_after_tahallul')).toBe(true)
    expect(hajjItems.some(i => i.id === 'intercourse_umrah')).toBe(false)
  })

  it('includes shared items (perfume, hunting, meeqat) in both rituals', () => {
    const hajjItems = getFidyahItemsForRitual('hajj')
    const umrahItems = getFidyahItemsForRitual('umrah')
    for (const id of ['perfume', 'hunting', 'meeqat_crossed', 'marriage_contract']) {
      expect(hajjItems.some(i => i.id === id)).toBe(true)
      expect(umrahItems.some(i => i.id === id)).toBe(true)
    }
  })

  it('every item has a unique id', () => {
    const ids = FIDYAH_ITEMS.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
