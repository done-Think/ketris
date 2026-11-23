import type { AppLocale } from '@/i18n/types/locale.types'

import type {
  AvailableFavoriteEntry,
  FavoritePropertyEntry,
  FavoritesCounts,
  FavoritesFilters,
  FavoritesPurposeFilter,
} from '../types/favorite-property'
import type { PropertyText } from '../types/property-presentation'
import type { SearchResultProperty, SearchResultPurpose } from '../types/search'
import { mapSummaryToSearchResult } from './property-summary-adapter'

function matchesPurpose(entry: FavoritePropertyEntry, purpose: FavoritesPurposeFilter) {
  if (purpose === 'all') return true
  if (!entry.available) return false
  const listing = entry.property.purpose
  return listing === 'BOTH' || listing === (purpose === 'rent' ? 'RENT' : 'SALE')
}

export function getFavoriteCardPurpose(
  entry: AvailableFavoriteEntry,
  purpose: FavoritesPurposeFilter,
): SearchResultPurpose {
  if (purpose === 'buy' || entry.property.purpose === 'SALE') return 'comprar'
  return 'alugar'
}

function priceOf(entry: FavoritePropertyEntry, purpose: FavoritesPurposeFilter) {
  if (!entry.available) return null
  const { price, rentalPrice } = entry.property
  return getFavoriteCardPurpose(entry, purpose) === 'alugar' && entry.property.purpose === 'BOTH'
    ? (rentalPrice ?? price)
    : price
}

export function countFavorites(entries: FavoritePropertyEntry[]): FavoritesCounts {
  return {
    all: entries.length,
    rent: entries.filter((entry) => matchesPurpose(entry, 'rent')).length,
    buy: entries.filter((entry) => matchesPurpose(entry, 'buy')).length,
  }
}

export function selectFavorites(entries: FavoritePropertyEntry[], filters: FavoritesFilters) {
  const direction = filters.sort === 'maior-preco' ? -1 : 1

  return entries
    .filter((entry) => matchesPurpose(entry, filters.purpose))
    .sort((first, second) =>
      filters.sort === 'relevancia'
        ? second.savedAt.localeCompare(first.savedAt)
        : direction *
          ((priceOf(first, filters.purpose) ?? 0) - (priceOf(second, filters.purpose) ?? 0)),
    )
}

export function toFavoriteCard(
  entry: AvailableFavoriteEntry,
  purpose: FavoritesPurposeFilter,
  locale: AppLocale,
  t: PropertyText,
): SearchResultProperty {
  return mapSummaryToSearchResult(entry.property, getFavoriteCardPurpose(entry, purpose), locale, t)
}
