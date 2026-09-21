import type { ComponentType } from 'react'
import FidyahUpsellScreen from './FidyahUpsellScreen'

/**
 * The premium calculator is only bundled into the premium build. The test
 * below compares two literals once the bundler inlines
 * EXPO_PUBLIC_APP_VARIANT, so in the free build it is `false` and Metro
 * drops the require() — the calculator, its rules and its data never reach
 * the free APK. Keep it a bare `process.env.X === 'literal'` check inside a
 * ternary: anything cleverer (a helper, a variable) stops the bundler from
 * folding it and the calculator would ship in the free build again.
 */
const PremiumCalculator: ComponentType | null =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'premium'
    ? require('./FidyahCalculatorScreen').default
    : null

export default function FidyahScreen() {
  return PremiumCalculator ? <PremiumCalculator /> : <FidyahUpsellScreen />
}
