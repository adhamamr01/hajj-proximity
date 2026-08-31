import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Monetization isn't decided yet. This is a placeholder local flag with a
// dev-only toggle (in Settings) so premium screens can be built and
// previewed now — swap this whole module for real entitlement/billing
// logic (e.g. RevenueCat, Play Billing) before public release, and remove
// the dev toggle from Settings at that point.
const DEV_PREMIUM_KEY = 'dev_premium_enabled'

interface PremiumContextValue {
  isPremium: boolean
  setPremium: (value: boolean) => Promise<void>
}

const PremiumContext = createContext<PremiumContextValue | null>(null)

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(DEV_PREMIUM_KEY)
      .then(val => { if (val === 'true') setIsPremium(true) })
      .catch(() => {})
  }, [])

  const setPremium = useCallback(async (value: boolean) => {
    setIsPremium(value)
    try {
      await AsyncStorage.setItem(DEV_PREMIUM_KEY, String(value))
    } catch {
      // Non-fatal — the in-memory state above still reflects the toggle
      // for this session even if persisting it failed.
    }
  }, [])

  return (
    <PremiumContext.Provider value={{ isPremium, setPremium }}>
      {children}
    </PremiumContext.Provider>
  )
}

export function usePremium() {
  const ctx = useContext(PremiumContext)
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider')
  return ctx
}
