import { captureException } from '@sentry/nextjs'
import { z } from 'zod'

import type { RateLimitStore } from '@server/security/types/rate-limit.types'
import type { AddressCoordinates, AddressGeocoder, GeocodingAddress } from './address-geocoder.port'
import { brazilianStates } from './brazilian-states'

const coordinate = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/)
  .transform(Number)
const resultsSchema = z.array(
  z.object({
    lat: coordinate.pipe(z.number().min(-90).max(90)),
    lon: coordinate.pipe(z.number().min(-180).max(180)),
    address: z.record(z.string()),
  }),
)
const requestPolicy = { name: 'address-geocoding', limit: 1, windowMs: 1100 }
const cacheLimit = 512

function normalized(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
function normalizedStreet(value: string) {
  return normalized(value).replace(
    /^(rua|r|avenida|av|travessa|tv|alameda|estrada|rodovia|praca) /,
    '',
  )
}

export class NominatimAddressGeocoder implements AddressGeocoder {
  private readonly cache = new Map<
    string,
    { expiresAt: number; value: AddressCoordinates | null }
  >()
  private readonly pending = new Map<string, Promise<AddressCoordinates | null>>()

  constructor(
    private readonly searchUrl: string,
    private readonly userAgent: string,
    private readonly quota: RateLimitStore,
  ) {}

  async locate(address: GeocodingAddress): Promise<AddressCoordinates | null> {
    const key = JSON.stringify(
      [
        address.street,
        address.number,
        address.city,
        address.state,
        address.neighborhood ?? '',
        address.zipCode?.replace(/\D/g, '') ?? '',
      ].map(normalized),
    )
    const cached = this.cache.get(key)
    if (cached && cached.expiresAt > Date.now()) return cached.value
    const pending = this.pending.get(key)
    if (pending) return pending

    const request = this.lookup(address, key)
    this.pending.set(key, request)
    try {
      return await request
    } finally {
      this.pending.delete(key)
    }
  }

  private async lookup(address: GeocodingAddress, key: string): Promise<AddressCoordinates | null> {
    try {
      for (const freeForm of [false, true]) {
        // Both strategies share the same bucket across tenants, workers and instances.
        if (freeForm) await new Promise((resolve) => setTimeout(resolve, requestPolicy.windowMs))
        let quota = await this.quota.consume({ key: 'application', policy: requestPolicy })
        if (!quota.allowed && quota.retryAfter > 0 && quota.retryAfter <= 2) {
          await new Promise((resolve) => setTimeout(resolve, quota.retryAfter * 1000))
          quota = await this.quota.consume({ key: 'application', policy: requestPolicy })
        }
        if (!quota.allowed) return null
        const url = new URL(this.searchUrl)
        url.searchParams.set('format', 'jsonv2')
        url.searchParams.set('addressdetails', '1')
        url.searchParams.set('limit', '3')
        url.searchParams.set('countrycodes', 'br')
        if (freeForm) {
          url.searchParams.set(
            'q',
            [
              address.street,
              address.number,
              address.neighborhood,
              address.city,
              brazilianStates[address.state.toUpperCase()] ?? address.state,
              'Brasil',
            ]
              .filter(Boolean)
              .join(', '),
          )
        } else {
          url.searchParams.set('street', `${address.number} ${address.street}`)
          url.searchParams.set('city', address.city)
          url.searchParams.set(
            'state',
            brazilianStates[address.state.toUpperCase()] ?? address.state,
          )
        }
        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'application/json',
            'Accept-Language': 'pt-BR',
          },
          signal: AbortSignal.timeout(4000),
          // Persistent Next Data Cache complements the process cache and coordinates saved on the property.
          next: { revalidate: 86400 },
        })
        if (!response.ok) throw new Error(`Address geocoding returned HTTP ${response.status}.`)
        const results = resultsSchema.parse(await response.json())
        const result = results.find((candidate) => this.matchesAddress(candidate.address, address))
        if (result) {
          const value = { latitude: result.lat, longitude: result.lon }
          this.remember(key, value, 86400000)
          return value
        }
      }
      this.remember(key, null, 900000)
      return null
    } catch (error) {
      captureException(error)
      this.remember(key, null, 10000)
      return null
    }
  }

  private matchesAddress(candidate: Record<string, string>, requested: GeocodingAddress) {
    const state = requested.state.toUpperCase()
    const cityMatches = ['city', 'town', 'village', 'municipality'].some(
      (key) => candidate[key] && normalized(candidate[key]) === normalized(requested.city),
    )
    const stateMatches = candidate['ISO3166-2-lvl4']
      ? candidate['ISO3166-2-lvl4'] === `BR-${state}`
      : normalized(candidate.state ?? '') === normalized(brazilianStates[state] ?? state)
    const street = candidate.road ?? candidate.pedestrian ?? candidate.residential ?? ''
    return (
      candidate.country_code === 'br' &&
      cityMatches &&
      stateMatches &&
      normalizedStreet(street) === normalizedStreet(requested.street) &&
      (!candidate.house_number ||
        normalized(candidate.house_number) === normalized(requested.number))
    )
  }

  private remember(key: string, value: AddressCoordinates | null, ttl: number) {
    this.cache.delete(key)
    if (this.cache.size >= cacheLimit) this.cache.delete(this.cache.keys().next().value!)
    this.cache.set(key, { value, expiresAt: Date.now() + ttl })
  }
}
