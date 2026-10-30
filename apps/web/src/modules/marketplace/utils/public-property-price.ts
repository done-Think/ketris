import type { AppLocale } from '@/i18n/types/locale.types'
import type { PublicPropertySummary } from '../types/public-property'
import type { PropertyText } from '../types/property-presentation'
import type { SearchResultPurpose } from '../types/search'
import { formatSearchCurrency } from './search'

export function formatPublicPropertyPrice(
  property: Pick<PublicPropertySummary, 'price' | 'rentalPrice' | 'purpose'>,
  purpose: SearchResultPurpose | undefined,
  locale: AppLocale,
  t: PropertyText,
) {
  const rental =
    property.purpose === 'RENT' || (property.purpose === 'BOTH' && purpose === 'alugar')
  const amount = rental && property.purpose === 'BOTH' ? property.rentalPrice : property.price
  if (amount == null) return t('priceOnRequest', { price: '' })
  const formatted = formatSearchCurrency(amount, locale)
  return rental ? t('monthly', { price: formatted }) : formatted
}
