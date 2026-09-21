import { Alert } from 'react-native'
import * as Location from 'expo-location'
import {
  hasFullLocationAccess,
  confirmBackgroundLocationDisclosure,
  ensureLocationDisclosureAccepted,
  DisclosureText,
} from './locationDisclosure'

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
}))

const text: DisclosureText = { title: 'T', body: 'B', decline: 'Not now', accept: 'Continue' }
const fg = Location.getForegroundPermissionsAsync as jest.Mock
const bg = Location.getBackgroundPermissionsAsync as jest.Mock
const alertSpy = jest.spyOn(Alert, 'alert')

/** Presses the named button on the most recently shown alert. */
function press(label: string) {
  const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2] ?? []
  buttons.find(b => b.text === label)?.onPress?.()
}

beforeEach(() => {
  alertSpy.mockReset()
  alertSpy.mockImplementation(() => undefined)
  fg.mockReset()
  bg.mockReset()
})

describe('hasFullLocationAccess', () => {
  it('is true only when both foreground and background are granted', async () => {
    fg.mockResolvedValue({ status: 'granted' })
    bg.mockResolvedValue({ status: 'granted' })
    expect(await hasFullLocationAccess()).toBe(true)
  })

  it('is false when foreground is missing, without asking about background', async () => {
    fg.mockResolvedValue({ status: 'denied' })
    expect(await hasFullLocationAccess()).toBe(false)
    expect(bg).not.toHaveBeenCalled()
  })

  it('is false when only foreground is granted', async () => {
    fg.mockResolvedValue({ status: 'granted' })
    bg.mockResolvedValue({ status: 'denied' })
    expect(await hasFullLocationAccess()).toBe(false)
  })
})

describe('confirmBackgroundLocationDisclosure', () => {
  it('shows the title and body and cannot be dismissed by tapping outside', () => {
    confirmBackgroundLocationDisclosure(text)
    const [title, body, , options] = alertSpy.mock.calls[0]
    expect(title).toBe('T')
    expect(body).toBe('B')
    expect(options).toEqual({ cancelable: false })
  })

  it('resolves true when the user accepts', async () => {
    const result = confirmBackgroundLocationDisclosure(text)
    press('Continue')
    await expect(result).resolves.toBe(true)
  })

  it('resolves false when the user declines', async () => {
    const result = confirmBackgroundLocationDisclosure(text)
    press('Not now')
    await expect(result).resolves.toBe(false)
  })
})

describe('ensureLocationDisclosureAccepted', () => {
  it('skips the disclosure when access is already fully granted', async () => {
    fg.mockResolvedValue({ status: 'granted' })
    bg.mockResolvedValue({ status: 'granted' })
    await expect(ensureLocationDisclosureAccepted(text)).resolves.toBe(true)
    expect(alertSpy).not.toHaveBeenCalled()
  })

  it('shows the disclosure before any permission has been granted', async () => {
    fg.mockResolvedValue({ status: 'undetermined' })
    const result = ensureLocationDisclosureAccepted(text)
    await new Promise(process.nextTick)
    expect(alertSpy).toHaveBeenCalledTimes(1)
    press('Continue')
    await expect(result).resolves.toBe(true)
  })

  it('reports a decline so the permission request is never made', async () => {
    fg.mockResolvedValue({ status: 'undetermined' })
    const result = ensureLocationDisclosureAccepted(text)
    await new Promise(process.nextTick)
    press('Not now')
    await expect(result).resolves.toBe(false)
  })
})
