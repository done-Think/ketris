export interface GeocodingAddress {
  street: string
  number: string
  city: string
  state: string
  neighborhood?: string
  zipCode?: string
}

export interface AddressCoordinates {
  latitude: number
  longitude: number
}

export interface AddressGeocoder {
  /** Returns null when the address cannot be resolved or the service is unavailable. */
  locate(address: GeocodingAddress): Promise<AddressCoordinates | null>
}

export const unavailableAddressGeocoder: AddressGeocoder = { locate: async () => null }
