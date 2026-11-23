import type { components } from '@shared/types/generated/api'

export type FavoritePropertiesResponse = components['schemas']['FavoritePropertiesResponse']

export type FavoritePropertyEntry = components['schemas']['FavoritePropertyEntry']

export type SavedFavoriteProperty = components['schemas']['SavedFavoriteProperty']

export type FavoriteToggleInput = {
  propertyId: string
  favorite: boolean
}

export type FavoriteButtonProps = {
  propertyId: string
}
