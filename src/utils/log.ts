/**
 * Minimal tagged logger. console.log/warn/error are forwarded to Android
 * logcat (tag: ReactNativeJS) even in release builds, so these are visible
 * via `adb logcat -s ReactNativeJS` when diagnosing issues on a device.
 */
export function log(tag: string, message: string, extra?: unknown) {
  if (extra !== undefined) {
    console.log(`[${tag}] ${message}`, extra)
  } else {
    console.log(`[${tag}] ${message}`)
  }
}

export function logError(tag: string, message: string, error?: unknown) {
  console.error(`[${tag}] ${message}`, error ?? '')
}
