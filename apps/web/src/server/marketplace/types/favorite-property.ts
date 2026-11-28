import type { PublishedPropertySummary } from './property'

export type FavoritePropertyOwner = {
  userId: string
  tenantId: string
}

export type FavoritePropertyKey = FavoritePropertyOwner & {
  propertyId: string
}

export type SavedFavoriteProperty = {
  propertyId: string
  savedAt: Date
}

export type UnavailableFavoriteProperty = {
  title: string
  city: string | null
  neighborhood: string | null
}

export type FavoritePropertyEntry =
  | (SavedFavoriteProperty & { available: true; property: PublishedPropertySummary })
  | (SavedFavoriteProperty & { available: false; property: UnavailableFavoriteProperty })

export type FavoritePropertiesActorInput = {
  actorId: string
  actorTenantId: string
}

export type FavoritePropertyInput = FavoritePropertiesActorInput & {
  propertyId: string
}

export type FavoritePropertiesOutput = {
  favorites: FavoritePropertyEntry[]
  limit: number
}

export type FavoritePropertyRouteContext = {
  params: Promise<{ propertyId: string }>
}
