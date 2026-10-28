// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NominatimAddressGeocoder } from '../../location/nominatim-address-geocoder'
import { resolveAddressCoordinates } from '../../location/resolve-address-coordinates'

const { captureException } = vi.hoisted(() => ({ captureException: vi.fn() }))
vi.mock('@sentry/nextjs', () => ({ captureException }))

const address = {
  street: 'Rua Padre Júlio Chevalier',
  number: '35',
  city: 'Itajubá',
  state: 'MG',
  neighborhood: 'Anhumas',
  zipCode: '37500-000',
  latitude: null,
  longitude: null,
}
const result = {
  lat: '-22.43',
  lon: '-45.45',
  address: {
    road: 'Rua Padre Júlio Chevalier',
    house_number: '35',
    city: 'Itajubá',
    state: 'Minas Gerais',
    'ISO3166-2-lvl4': 'BR-MG',
    country_code: 'br',
  },
}
function setup(payload: unknown = [result]) {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload)))
  vi.stubGlobal('fetch', fetch)
  const quota = { consume: vi.fn().mockResolvedValue({ allowed: true }) }
  const geocoder = new NominatimAddressGeocoder(
    'https://geocoder.example/search',
    'Ketris/1.0',
    quota,
  )
  return { fetch, quota, geocoder }
}
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('address geocoding', () => {
  it('queries street and number with city, state and country restrictions on the server', async () => {
    const { fetch, geocoder } = setup()
    await expect(geocoder.locate(address)).resolves.toEqual({ latitude: -22.43, longitude: -45.45 })
    const [url, options] = fetch.mock.calls[0]
    expect(url.searchParams.get('street')).toBe('35 Rua Padre Júlio Chevalier')
    expect(url.searchParams.get('city')).toBe('Itajubá')
    expect(url.searchParams.get('state')).toBe('Minas Gerais')
    expect(url.searchParams.get('countrycodes')).toBe('br')
    expect(options.headers['User-Agent']).toBe('Ketris/1.0')
    expect(options.next.revalidate).toBe(86400)
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })

  it('coalesces concurrent calls and caches the result', async () => {
    const { fetch, quota, geocoder } = setup()
    await Promise.all([geocoder.locate(address), geocoder.locate(address)])
    await geocoder.locate(address)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(quota.consume).toHaveBeenCalledTimes(1)
  })

  it('does not contact the provider when the application-wide quota is exhausted', async () => {
    const { fetch, quota, geocoder } = setup()
    quota.consume.mockResolvedValue({ allowed: false })
    expect(await geocoder.locate(address)).toBeNull()
    expect(fetch).not.toHaveBeenCalled()
    expect(quota.consume).toHaveBeenCalledWith({
      key: 'application',
      policy: {
        name: 'address-geocoding',
        limit: 1,
        windowMs: 1100,
      },
    })
  })

  it.each([
    { ...result.address, city: 'São Paulo' },
    { ...result.address, state: 'São Paulo', 'ISO3166-2-lvl4': 'BR-SP' },
    { ...result.address, road: 'Rua Outra' },
    { ...result.address, house_number: '350' },
    { ...result.address, country_code: 'pt' },
    { city: 'Itajubá', state: 'Minas Gerais', country_code: 'br' },
  ])('rejects a result outside the requested address: %j', async (candidate) => {
    const { geocoder } = setup([{ ...result, address: candidate }])
    expect(await geocoder.locate(address)).toBeNull()
  })

  it('accepts a street location when the house number is not mapped', async () => {
    const candidate: Partial<typeof result.address> = { ...result.address }
    delete candidate.house_number
    const { geocoder } = setup([{ ...result, address: candidate }])
    expect(await geocoder.locate(address)).toEqual({ latitude: -22.43, longitude: -45.45 })
  })

  it.each([
    { payload: [] },
    { payload: [{ ...result, lat: '91' }] },
    { payload: [{ ...result, lon: '' }] },
  ])('returns null for missing or invalid results', async ({ payload }) => {
    const { geocoder } = setup(payload)
    expect(await geocoder.locate(address)).toBeNull()
  })

  it('keeps the address usable during provider failure and avoids hammering the failed service', async () => {
    const { fetch, geocoder } = setup()
    fetch.mockRejectedValue(new Error('Network unavailable'))
    expect(await resolveAddressCoordinates(address, geocoder)).toEqual(address)
    expect(await geocoder.locate(address)).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(captureException).toHaveBeenCalledTimes(1)
  })

  it('handles upstream 429 and shared-quota failure without breaking property access', async () => {
    const { fetch, quota, geocoder } = setup()
    fetch.mockResolvedValue(new Response('', { status: 429 }))
    expect(await geocoder.locate(address)).toBeNull()
    quota.consume.mockRejectedValue(new Error('Database unavailable'))
    expect(await geocoder.locate({ ...address, number: '36' })).toBeNull()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('preserves a complete manual position without an external lookup', async () => {
    const { fetch, geocoder } = setup()
    const manual = { ...address, latitude: -22.44, longitude: -45.44 }
    expect(await resolveAddressCoordinates(manual, geocoder)).toEqual(manual)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not reuse incomplete coordinates as a valid position', async () => {
    const { geocoder } = setup([])
    expect(await resolveAddressCoordinates({ ...address, latitude: -23.55 }, geocoder)).toEqual(
      address,
    )
  })
})
