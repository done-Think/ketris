import { PostgresRateLimitStore } from '@server/security/postgres-rate-limit-store'
import { unavailableAddressGeocoder } from './address-geocoder.port'
import { NominatimAddressGeocoder } from './nominatim-address-geocoder'

// An explicit endpoint is required: the public OSM service must never be enabled implicitly.
export const addressGeocoder = process.env.GEOCODING_SEARCH_URL
  ? new NominatimAddressGeocoder(
      process.env.GEOCODING_SEARCH_URL,
      process.env.GEOCODING_USER_AGENT || 'Ketris/1.0 (+https://github.com/done-Think/ketris)',
      new PostgresRateLimitStore(),
    )
  : unavailableAddressGeocoder
