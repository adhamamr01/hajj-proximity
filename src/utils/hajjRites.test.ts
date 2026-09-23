import {
  minaStatus, minaFidyahIds, totalPebblesMissed, ramyFidyahIds, riteFidyahIds,
  MinaInput, PebblesMissed, PEBBLE_LIMITS, MAX_MUDD_PEBBLES,
} from './hajjRites'
import { calculateFidyah, expandCounts } from './fidyahCalculator'
import { getFidyahItemsForRitual } from '../data/fidyah'

const mina = (o: Partial<MinaInput> = {}): MinaInput => ({
  missedNight1: false, missedNight2: false, missedNight3: false, leftEarly: false, ...o,
})
const noPebbles: PebblesMissed = { nahr: 0, tashreeq1: 0, tashreeq2: 0, tashreeq3: 0 }
const outcome = (m: MinaInput) => {
  const ids = minaFidyahIds(m)
  return ids[0] === 'mina_all_missed' ? 'dam' : ids.length
}

describe('Mina nights', () => {
  it('owes nothing when every night was stayed', () => {
    expect(outcome(mina())).toBe(0)
  })

  it('owes nothing for the third night when leaving early', () => {
    expect(outcome(mina({ leftEarly: true }))).toBe(0)
    expect(minaStatus(mina({ leftEarly: true })).thirdNightMissed).toBe(false)
  })

  it('owes one mudd for a single missed night 1 or 2 while staying the third', () => {
    expect(outcome(mina({ missedNight1: true }))).toBe(1)
    expect(outcome(mina({ missedNight2: true }))).toBe(1)
  })

  it('owes one mudd for skipping only the third night after staying on past sunset', () => {
    expect(outcome(mina({ missedNight3: true }))).toBe(1)
  })

  it('owes two mudd for nights 1 and 2 while staying the third', () => {
    expect(outcome(mina({ missedNight1: true, missedNight2: true }))).toBe(2)
  })

  it('charges only the nights actually missed when leaving early', () => {
    expect(outcome(mina({ missedNight1: true, leftEarly: true }))).toBe(1)
    expect(outcome(mina({ missedNight2: true, leftEarly: true }))).toBe(1)
  })

  it('owes a dam for nights 1 and 2 missed when leaving early — every night that applied', () => {
    expect(outcome(mina({ missedNight1: true, missedNight2: true, leftEarly: true }))).toBe('dam')
  })

  it('owes a dam for all three nights, replacing the mudds', () => {
    expect(minaFidyahIds(mina({ missedNight1: true, missedNight2: true, missedNight3: true })))
      .toEqual(['mina_all_missed'])
  })

  it('ignores the third-night flag once the pilgrim left early', () => {
    expect(outcome(mina({ leftEarly: true, missedNight3: true }))).toBe(0)
  })

  it('reduces every combination of the three nights to one of four outcomes', () => {
    const seen = new Set<string | number>()
    for (const n1 of [false, true]) for (const n2 of [false, true]) for (const n3 of [false, true]) {
      for (const leftEarly of [false, true]) {
        seen.add(outcome(mina({ missedNight1: n1, missedNight2: n2, missedNight3: n3, leftEarly })))
      }
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 'dam'])
  })
})

describe('stoning', () => {
  it('owes nothing when no pebbles were missed', () => {
    expect(ramyFidyahIds(0)).toEqual([])
  })

  it('owes one mudd for 1 to 7 pebbles', () => {
    expect(ramyFidyahIds(1)).toEqual(['ramy_partial'])
    expect(ramyFidyahIds(3)).toEqual(['ramy_partial'])
    expect(ramyFidyahIds(7)).toEqual(['ramy_partial'])
  })

  it('owes two mudd for 8 to 14 pebbles', () => {
    expect(ramyFidyahIds(8)).toEqual(['ramy_partial', 'ramy_partial'])
    expect(ramyFidyahIds(14)).toEqual(['ramy_partial', 'ramy_partial'])
  })

  it('owes one dam above 14 pebbles, however many', () => {
    expect(MAX_MUDD_PEBBLES).toBe(14)
    expect(ramyFidyahIds(15)).toEqual(['ramy_dam'])
    expect(ramyFidyahIds(70)).toEqual(['ramy_dam'])
  })

  it('adds pebbles across days', () => {
    expect(totalPebblesMissed({ nahr: 1, tashreeq1: 1, tashreeq2: 1, tashreeq3: 0 }, mina())).toBe(3)
  })

  it('never counts more than each day allows', () => {
    const huge = { nahr: 99, tashreeq1: 99, tashreeq2: 99, tashreeq3: 99 }
    expect(totalPebblesMissed(huge, mina())).toBe(7 + 21 + 21 + 21)
    expect(PEBBLE_LIMITS.nahr + PEBBLE_LIMITS.tashreeq1 + PEBBLE_LIMITS.tashreeq2 + PEBBLE_LIMITS.tashreeq3).toBe(70)
  })

  it('drops the 13th-day stoning after an early departure', () => {
    expect(totalPebblesMissed({ ...noPebbles, tashreeq3: 5 }, mina({ leftEarly: true }))).toBe(0)
    expect(totalPebblesMissed(noPebbles, mina({ leftEarly: true, missedNight1: true }))).toBe(0)
  })
})

describe('riteFidyahIds', () => {
  const base = { meeqatCrossed: false, muzdalifahMissed: false, mina: mina(), pebbles: noPebbles }

  it('owes nothing by default', () => {
    expect(riteFidyahIds({ ritual: 'hajj', ...base })).toEqual([])
  })

  it('counts the Meeqat once, for Hajj and Umrah', () => {
    expect(riteFidyahIds({ ritual: 'umrah', ...base, meeqatCrossed: true })).toEqual(['meeqat_crossed'])
    expect(riteFidyahIds({ ritual: 'hajj', ...base, meeqatCrossed: true })).toEqual(['meeqat_crossed'])
  })

  it('ignores Hajj-only rites for Umrah', () => {
    const ids = riteFidyahIds({
      ritual: 'umrah', meeqatCrossed: false, muzdalifahMissed: true,
      mina: mina({ missedNight1: true, missedNight2: true, missedNight3: true }),
      pebbles: { nahr: 7, tashreeq1: 21, tashreeq2: 21, tashreeq3: 21 },
    })
    expect(ids).toEqual([])
  })

  it('keeps Muzdalifah and Mina as separate dams', () => {
    const ids = riteFidyahIds({
      ritual: 'hajj', ...base, muzdalifahMissed: true,
      mina: mina({ missedNight1: true, missedNight2: true, missedNight3: true }),
    })
    expect(calculateFidyah(ids)).toEqual([
      { tier: 'full', count: 2, itemIds: ['muzdalifah_missed', 'mina_all_missed'] },
    ])
  })

  it('shows a full fidyah for leaving early after missing both nights, all the way to the summary', () => {
    const ids = riteFidyahIds({
      ritual: 'hajj', ...base, mina: mina({ leftEarly: true, missedNight1: true, missedNight2: true }),
    })
    expect(calculateFidyah(ids)).toEqual([{ tier: 'full', count: 1, itemIds: ['mina_all_missed'] }])
  })

  it('merges night and pebble mudds into one partial total', () => {
    const ids = riteFidyahIds({
      ritual: 'hajj', ...base, mina: mina({ missedNight1: true }),
      pebbles: { ...noPebbles, nahr: 1 },
    })
    expect(calculateFidyah(ids)).toEqual([
      { tier: 'partial', count: 2, itemIds: ['mina_partial_missed', 'ramy_partial'] },
    ])
  })
})

describe('expandCounts', () => {
  it('counts a mudd for each hair or nail up to two', () => {
    expect(expandCounts({ hair_removal_partial: 1 })).toEqual(['hair_removal_partial'])
    expect(expandCounts({ nail_trim_partial: 2 })).toEqual(['nail_trim_partial', 'nail_trim_partial'])
  })

  it('turns three or more hairs, or three or more nails, into one full fidyah however many are added', () => {
    expect(expandCounts({ hair_removal_partial: 3 })).toEqual(['hair_removal_full'])
    expect(expandCounts({ hair_removal_partial: 9 })).toEqual(['hair_removal_full'])
    expect(expandCounts({ nail_trim_partial: 3 })).toEqual(['nail_trim_full'])
    expect(expandCounts({ nail_trim_partial: 20 })).toEqual(['nail_trim_full'])
  })

  it('keeps hairs and nails separate, and leaves an explicit three-or-more item alone', () => {
    expect(calculateFidyah(expandCounts({ hair_removal_partial: 2, nail_trim_partial: 4 })))
      .toEqual([
        { tier: 'partial', count: 2, itemIds: ['hair_removal_partial', 'hair_removal_partial'] },
        { tier: 'choice', count: 1, itemIds: ['nail_trim_full'] },
      ])
    expect(expandCounts({ hair_removal_full: 2, hair_removal_partial: 3 }))
      .toEqual(['hair_removal_full', 'hair_removal_full', 'hair_removal_full'])
  })

  it('leaves items with no natural limit uncapped', () => {
    expect(expandCounts({ perfume: 4 })).toHaveLength(4)
    expect(expandCounts({ intercourse_repeat: 3, hunting: 2 })).toHaveLength(5)
  })

  it('counts a once-only item at most once, however many times it is passed in', () => {
    expect(expandCounts({ marriage_contract: 7 })).toEqual(['marriage_contract'])
    expect(expandCounts({ ihsar: 3 })).toEqual(['ihsar'])
    expect(expandCounts({ intercourse_before_tahallul: 2 })).toEqual(['intercourse_before_tahallul'])
    expect(expandCounts({ intercourse_umrah: 5 })).toEqual(['intercourse_umrah'])
  })

  it('ignores unknown ids and negative counts', () => {
    expect(expandCounts({ nope: 3, perfume: -2 })).toEqual([])
  })
})

describe('intercourse', () => {
  it('owes the camel once, and the free-choice fidyah for each further time', () => {
    const result = calculateFidyah(expandCounts({
      intercourse_before_tahallul: 1, intercourse_repeat: 2, intercourse_after_tahallul: 1,
    }))
    expect(result.find(r => r.tier === 'severe')?.count).toBe(1)
    expect(result.find(r => r.tier === 'choice')?.count).toBe(3)
  })

  it('offers the once-only first intercourse for the matching rite only', () => {
    const hajj = getFidyahItemsForRitual('hajj').map(i => i.id)
    const umrah = getFidyahItemsForRitual('umrah').map(i => i.id)
    expect(hajj).toContain('intercourse_before_tahallul')
    expect(hajj).toContain('intercourse_after_tahallul')
    expect(hajj).not.toContain('intercourse_umrah')
    expect(umrah).toContain('intercourse_umrah')
    expect(umrah).not.toContain('intercourse_before_tahallul')
    expect(umrah).not.toContain('intercourse_after_tahallul')
    expect(hajj).toContain('intercourse_repeat')
    expect(umrah).toContain('intercourse_repeat')
  })
})
