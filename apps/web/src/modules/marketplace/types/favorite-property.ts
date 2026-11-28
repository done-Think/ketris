import type { components } from '@shared/types/generated/api'

import type { favoritesPurposeFilters } from '../config/favorites'
import type { SortOption } from './search'

export type FavoritePropertiesResponse = components['schemas']['FavoritePropertiesResponse']

export type FavoritePropertyEntry = components['schemas']['FavoritePropertyEntry']

export type SavedFavoriteProperty = components['schemas']['SavedFavoriteProperty']

export type FavoriteToggleInput = {
  propertyId: string
  favorite: boolean
}

export type FavoriteButtonVariant = 'detail' | 'card'

export type FavoriteButtonProps = {
  propertyId: string
  variant: FavoriteButtonVariant
}

export type FavoriteLoginDialogProps = {
  propertyId: string
  onClose: () => void
}

export type SaveFavoriteAfterLoginOptions = {
  propertyId: string
  onSave: () => void
}

export type FavoritesPurposeFilter = (typeof favoritesPurposeFilters)[number]

export type FavoritesFilters = {
  purpose: FavoritesPurposeFilter
  sort: SortOption
}

export type FavoritesCounts = Record<FavoritesPurposeFilter, number>

export type AvailableFavoriteEntry = Extract<FavoritePropertyEntry, { available: true }>

export type FavoritesPurposeChipsProps = {
  counts: FavoritesCounts
  value: FavoritesPurposeFilter
  onChange: (purpose: FavoritesPurposeFilter) => void
}

export type FavoritesEmptyStateProps = {
  variant: 'guest' | 'empty'
}
