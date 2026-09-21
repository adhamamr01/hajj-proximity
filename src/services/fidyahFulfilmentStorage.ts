import AsyncStorage from '@react-native-async-storage/async-storage'
import { FulfilObligation, parseObligations } from '../utils/fidyahFulfilment'

const STORAGE_KEY = 'fidyah_fulfilment'

export async function loadObligations(): Promise<FulfilObligation[]> {
  try {
    return parseObligations(await AsyncStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

export function saveObligations(obligations: FulfilObligation[]): Promise<void> {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(obligations))
}

export async function addObligations(added: FulfilObligation[]): Promise<void> {
  await saveObligations([...(await loadObligations()), ...added])
}
