import { resolveLocale, isRTL } from './locale'

describe('resolveLocale', () => {
  it('uses the explicit preference when set to en', () => {
    expect(resolveLocale('en', 'ar')).toBe('en')
  })

  it('uses the explicit preference when set to ar', () => {
    expect(resolveLocale('ar', 'en')).toBe('ar')
  })

  it('falls back to the device locale when preference is system and device is Arabic', () => {
    expect(resolveLocale('system', 'ar')).toBe('ar')
    expect(resolveLocale('system', 'ar-SA')).toBe('ar')
  })

  it('falls back to English when preference is system and device is not Arabic', () => {
    expect(resolveLocale('system', 'en')).toBe('en')
    expect(resolveLocale('system', 'fr')).toBe('en')
    expect(resolveLocale('system', 'ur')).toBe('en')
  })

  it('is case-insensitive for the device locale code', () => {
    expect(resolveLocale('system', 'AR')).toBe('ar')
  })
})

describe('isRTL', () => {
  it('is true only for Arabic', () => {
    expect(isRTL('ar')).toBe(true)
    expect(isRTL('en')).toBe(false)
  })
})
