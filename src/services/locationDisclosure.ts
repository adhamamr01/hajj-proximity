import { Alert } from 'react-native'
import * as Location from 'expo-location'

/**
 * Google Play requires an in-app "prominent disclosure" before the app asks
 * for background location: what is collected, that it happens while the app
 * is closed, and what it is used for — with an explicit accept/decline
 * choice. The privacy policy or store listing alone don't satisfy it.
 */

export interface DisclosureText {
  title: string
  body: string
  decline: string
  accept: string
}

/** True once foreground and background location are both already granted. */
export async function hasFullLocationAccess(): Promise<boolean> {
  const fg = await Location.getForegroundPermissionsAsync()
  if (fg.status !== 'granted') return false
  const bg = await Location.getBackgroundPermissionsAsync()
  return bg.status === 'granted'
}

/**
 * Shows the disclosure and resolves true only if the user taps accept.
 * It can't be dismissed by tapping outside or pressing back, so declining
 * is always an explicit choice.
 */
export function confirmBackgroundLocationDisclosure(text: DisclosureText): Promise<boolean> {
  return new Promise(resolve => {
    Alert.alert(
      text.title,
      text.body,
      [
        { text: text.decline, style: 'cancel', onPress: () => resolve(false) },
        { text: text.accept, onPress: () => resolve(true) },
      ],
      { cancelable: false },
    )
  })
}

/**
 * The gate to run before requesting location permissions: resolves true when
 * it is fine to go ahead — access is already granted, or the user accepted
 * the disclosure.
 */
export async function ensureLocationDisclosureAccepted(text: DisclosureText): Promise<boolean> {
  if (await hasFullLocationAccess()) return true
  return confirmBackgroundLocationDisclosure(text)
}
