import type { AddressCoordinates, AddressGeocoder, GeocodingAddress } from './address-geocoder.port'

type LocatedAddress = GeocodingAddress & {
  latitude: number | null
  longitude: number | null
  neighborhood?: string
  zipCode?: string
}

export function hasAddressCoordinates(value: {
  latitude: number | null
  longitude: number | null
}): value is AddressCoordinates {
  return (
    value.latitude !== null &&
    value.longitude !== null &&
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180
  )
}

export async function resolveAddressCoordinates<T extends LocatedAddress>(
  address: T | undefined,
  geocoder: AddressGeocoder,
  previous?: LocatedAddress | null,
): Promise<T | undefined> {
  if (!address) return undefined
  const locationChanged =
    previous &&
    (['street', 'number', 'neighborhood', 'city', 'state', 'zipCode'] as const).some(
      (field) => address[field] !== previous[field],
    )
  const staleCoordinates =
    locationChanged &&
    address.latitude === previous.latitude &&
    address.longitude === previous.longitude
  if (hasAddressCoordinates(address) && !staleCoordinates) return address

  const coordinates = await geocoder.locate(address)
  return {
    ...address,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
  }
}
