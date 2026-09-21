import {
  obligationsFromResults, obligationsFromManual, chooseOption, canChangeOption, resetOption,
  tick, untick, isComplete, progressSummary, parseObligations, FULFIL_OPTIONS, MANUAL_TIERS,
  MAX_MANUAL_COUNT, ORDERED_TIERS, FulfilObligation,
} from './fidyahFulfilment'
import { calculateFidyah } from './fidyahCalculator'

const one = (tier: Parameters<typeof obligationsFromManual>[0]): FulfilObligation =>
  obligationsFromManual(tier, 1)[0]

describe('obligationsFromResults', () => {
  it('makes one obligation per fidyah, remembering where each came from', () => {
    const obs = obligationsFromResults(calculateFidyah(['perfume', 'sewn_clothing', 'meeqat_crossed']))
    expect(obs.map(o => [o.tier, o.sourceId])).toEqual([
      ['choice', 'perfume'], ['choice', 'sewn_clothing'], ['full', 'meeqat_crossed'],
    ])
    expect(obs.every(o => o.optionId === null && o.total === 0)).toBe(true)
  })

  it('merges every mudd into one obligation that is already counted', () => {
    const obs = obligationsFromResults(
      calculateFidyah(['mina_partial_missed', 'ramy_partial', 'hair_removal_partial']),
    )
    expect(obs).toHaveLength(1)
    expect(obs[0]).toMatchObject({ tier: 'partial', optionId: 'mudd', total: 3, remaining: 3 })
  })

  it('leaves out the marriage contract, which owes nothing', () => {
    expect(obligationsFromResults(calculateFidyah(['marriage_contract']))).toEqual([])
  })

  it('gives every obligation its own id', () => {
    const obs = obligationsFromResults(calculateFidyah(['perfume', 'perfume', 'perfume']))
    expect(new Set(obs.map(o => o.id)).size).toBe(3)
  })
})

describe('obligationsFromManual', () => {
  it('adds the requested number of separate fidyahs', () => {
    expect(obligationsFromManual('choice', 3)).toHaveLength(3)
  })

  it('adds mudds as one counted obligation', () => {
    expect(obligationsFromManual('partial', 4)).toMatchObject([{ total: 4, remaining: 4, optionId: 'mudd' }])
  })

  it('adds nothing for zero, negative or non-numeric counts', () => {
    expect(obligationsFromManual('full', 0)).toEqual([])
    expect(obligationsFromManual('full', -2)).toEqual([])
    expect(obligationsFromManual('full', NaN)).toEqual([])
  })

  it('caps the count', () => {
    expect(obligationsFromManual('choice', 9999)).toHaveLength(MAX_MANUAL_COUNT)
  })

  it('offers every tier that can be owed and never the marriage contract', () => {
    expect([...MANUAL_TIERS].sort()).toEqual(Object.keys(FULFIL_OPTIONS).sort())
  })
})

describe('options', () => {
  it('lists the free-choice fidyah as sheep, fasting or feeding', () => {
    expect(FULFIL_OPTIONS.choice.map(o => [o.id, o.units])).toEqual([
      ['sacrifice', 1], ['fast3', 3], ['feed6', 6],
    ])
  })

  it('lists the missed-rite dam as sheep, then ten days fasting', () => {
    expect(FULFIL_OPTIONS.full.map(o => [o.id, o.units])).toEqual([['sacrifice', 1], ['fast10', 10]])
  })

  it('lists the camel, cow, seven sheep, then value-based options for the severe case', () => {
    expect(FULFIL_OPTIONS.severe.map(o => o.id)).toEqual(['camel', 'cow', 'sheep7', 'foodValue', 'fastValue'])
    expect(ORDERED_TIERS).toContain('severe')
  })

  it('treats hunting as a free choice and Ihsar as ordered', () => {
    expect(ORDERED_TIERS).not.toContain('hunting')
    expect(ORDERED_TIERS).toContain('ihsar')
  })

  it('needs a prompt for every option without a fixed number of steps, except mudds', () => {
    for (const [tier, options] of Object.entries(FULFIL_OPTIONS)) {
      for (const o of options) {
        if (o.units === null && tier !== 'partial') expect(o.promptKey).toBeDefined()
      }
    }
  })
})

describe('chooseOption', () => {
  it('sets the steps from the chosen option', () => {
    expect(chooseOption(one('choice'), 'fast3')).toMatchObject({ optionId: 'fast3', total: 3, remaining: 3 })
    expect(chooseOption(one('full'), 'fast10')).toMatchObject({ total: 10, remaining: 10 })
    expect(chooseOption(one('severe'), 'sheep7')).toMatchObject({ total: 7, remaining: 7 })
  })

  it('takes the steps from the pilgrim for a value-based option', () => {
    expect(chooseOption(one('hunting'), 'foodValue', 12)).toMatchObject({ optionId: 'foodValue', total: 12 })
    expect(chooseOption(one('ihsar'), 'fastValue', 5.9)).toMatchObject({ optionId: 'fastValue', total: 5 })
  })

  it('does nothing without a usable amount', () => {
    const ob = one('hunting')
    expect(chooseOption(ob, 'foodValue')).toBe(ob)
    expect(chooseOption(ob, 'foodValue', 0)).toBe(ob)
    expect(chooseOption(ob, 'foodValue', -3)).toBe(ob)
  })

  it('ignores an option the tier does not have', () => {
    const ob = one('choice')
    expect(chooseOption(ob, 'camel')).toBe(ob)
  })
})

describe('progress', () => {
  it('ticks down to zero and completes', () => {
    let ob = chooseOption(one('choice'), 'fast3')
    expect(isComplete(ob)).toBe(false)
    ob = tick(tick(ob))
    expect(ob.remaining).toBe(1)
    ob = tick(ob)
    expect(isComplete(ob)).toBe(true)
  })

  it('never goes below zero or above the total', () => {
    const ob = chooseOption(one('choice'), 'sacrifice')
    expect(tick(tick(ob)).remaining).toBe(0)
    expect(untick(ob).remaining).toBe(1)
  })

  it('can undo a tick', () => {
    const ob = chooseOption(one('choice'), 'fast3')
    expect(untick(tick(ob))).toEqual(ob)
  })

  it('is not complete before a method is chosen', () => {
    expect(isComplete(one('choice'))).toBe(false)
  })

  it('counts completed fidyahs', () => {
    const done = tick(chooseOption(one('choice'), 'sacrifice'))
    expect(progressSummary([done, one('full'), one('choice')])).toEqual({ done: 1, total: 3 })
    expect(progressSummary([])).toEqual({ done: 0, total: 0 })
  })

  it('lets the method change only before progress, and never for mudds', () => {
    const fresh = chooseOption(one('choice'), 'fast3')
    expect(canChangeOption(fresh)).toBe(true)
    expect(resetOption(fresh)).toMatchObject({ optionId: null, total: 0, remaining: 0 })
    expect(canChangeOption(tick(fresh))).toBe(false)
    expect(resetOption(tick(fresh))).toEqual(tick(fresh))
    expect(canChangeOption(one('partial'))).toBe(false)
    expect(canChangeOption(one('choice'))).toBe(false)
  })
})

describe('parseObligations', () => {
  it('round-trips what was saved', () => {
    const obs = [
      tick(chooseOption(one('choice'), 'fast3')), one('full'), ...obligationsFromManual('partial', 2),
    ]
    expect(parseObligations(JSON.stringify(obs))).toEqual(obs)
  })

  it('returns nothing for missing, broken or non-list data', () => {
    expect(parseObligations(null)).toEqual([])
    expect(parseObligations('')).toEqual([])
    expect(parseObligations('{not json')).toEqual([])
    expect(parseObligations('{"a":1}')).toEqual([])
  })

  it('drops malformed entries and keeps the good ones', () => {
    const good = one('full')
    const bad = [
      null, 5, {},
      { ...good, tier: 'marriage' },
      { ...good, tier: 'nonsense' },
      { ...good, optionId: 'camel', total: 1, remaining: 1 },
      { ...good, optionId: 'sacrifice', total: 1, remaining: 2 },
      { ...good, optionId: 'sacrifice', total: -1, remaining: 0 },
      { ...good, optionId: null, total: 3, remaining: 3 },
      { ...good, optionId: 'sacrifice', total: 0, remaining: 0 },
      { ...good, sourceId: 7 },
    ]
    expect(parseObligations(JSON.stringify([...bad, good]))).toEqual([good])
  })
})
