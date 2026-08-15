import { translations } from './translations'

describe('translations', () => {
  it('has an identical key set in en and ar', () => {
    const enKeys = Object.keys(translations.en).sort()
    const arKeys = Object.keys(translations.ar).sort()
    expect(arKeys).toEqual(enKeys)
  })

  it('has no empty string values in either language', () => {
    for (const [locale, dict] of Object.entries(translations)) {
      for (const [key, value] of Object.entries(dict)) {
        if (value.length === 0) throw new Error(`${locale}.${key} should not be empty`)
      }
    }
  })

  it('preserves interpolation placeholders across languages', () => {
    const placeholderKeys = ['nearestMeeqatBanner', 'thresholdOption', 'distanceFromMakkah', 'notifMeeqatBody']
    const extractPlaceholders = (s: string) => (s.match(/\{[a-zA-Z]+\}/g) ?? []).sort()

    for (const key of placeholderKeys) {
      const enPlaceholders = extractPlaceholders(translations.en[key as keyof typeof translations.en])
      const arPlaceholders = extractPlaceholders(translations.ar[key as keyof typeof translations.ar])
      expect(arPlaceholders).toEqual(enPlaceholders)
    }
  })
})
