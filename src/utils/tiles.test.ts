/**
 * @jest-environment node
 *
 * Network test — verifies the tile server is reachable and returns image tiles.
 * Catches tile-server blocking issues without needing a device build.
 * Uses Node's https module directly to avoid jest-expo's fetch mock.
 */
import * as https from 'https'
import { TILE_URL } from './tiles'

// Makkah at zoom 10: x=625, y=449
const SAMPLE_TILE = TILE_URL
  .replace('{z}', '10')
  .replace('{y}', '449')
  .replace('{x}', '625')

function get(url: string): Promise<{ status: number; contentType: string | null }> {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      resolve({ status: res.statusCode ?? 0, contentType: res.headers['content-type'] ?? null })
      res.resume()
    }).on('error', reject)
  })
}

describe('tile server', () => {
  it('returns HTTP 200 for a Makkah-area tile', async () => {
    const { status } = await get(SAMPLE_TILE)
    expect(status).toBe(200)
  }, 10_000)

  it('returns an image content-type', async () => {
    const { contentType } = await get(SAMPLE_TILE)
    expect(contentType).toMatch(/image/)
  }, 10_000)
})
