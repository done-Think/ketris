import type { AppLocale } from '@/i18n/types/locale.types'

import type { AvailableFavoriteEntry, FavoritesPurposeFilter } from '../types/favorite-property'
import type { PropertyText } from '../types/property-presentation'
import type { SearchResultProperty, SearchResultPurpose } from '../types/search'
import { mapSummaryToSearchResult } from './property-summary-adapter'

export function getFavoriteCardPurpose(
  entry: AvailableFavoriteEntry,
  purpose: FavoritesPurposeFilter,
): SearchResultPurpose {
  if (purpose === 'buy' || entry.property.purpose === 'SALE') return 'comprar'
  return 'alugar'
}

export function toFavoriteCard(
  entry: AvailableFavoriteEntry,
  purpose: FavoritesPurposeFilter,
  locale: AppLocale,
  t: PropertyText,
): SearchResultProperty {
  return mapSummaryToSearchResult(entry.property, getFavoriteCardPurpose(entry, purpose), locale, t)
}
