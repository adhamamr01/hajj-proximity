import AsyncStorage from '@react-native-async-storage/async-storage'
import { FulfillObligation, parseObligations } from '../utils/fidyahFulfillment'

const STORAGE_KEY = 'fidyah_fulfillment'

export async function loadObligations(): Promise<FulfillObligation[]> {
  try {
    return parseObligations(await AsyncStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

export function saveObligations(obligations: FulfillObligation[]): Promise<void> {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(obligations))
}

export async function addObligations(added: FulfillObligation[]): Promise<void> {
  await saveObligations([...(await loadObligations()), ...added])
}
