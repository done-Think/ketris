import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { SearchResultsPage } from '@modules/marketplace'
import type { SearchResultPurpose } from '@modules/marketplace/types/search'
import type { SearchResultsRoutePageProps } from '@modules/marketplace/types/search'

function getSelectedPurpose(searchParams: SearchResultsRoutePageProps['searchParams']) {
  const purpose = searchParams?.purpose

  if (purpose === 'buy' || purpose === 'comprar') return 'comprar'

  return 'alugar'
}

function getSelectedLocation(searchParams: SearchResultsRoutePageProps['searchParams']) {
  return searchParams?.location
}

export async function generateMetadata({
  params,
  searchParams,
}: LocaleRoutePageProps<
  Record<never, never>,
  NonNullable<SearchResultsRoutePageProps['searchParams']>
>) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams
  const t = await getTranslations({ locale, namespace: 'marketplace.metadata' })
  const metadataKey =
    getSelectedPurpose(resolvedSearchParams) === 'comprar' ? 'searchBuy' : 'searchRent'

  return {
    title: t(`${metadataKey}.metadataTitle`),
    description: t(`${metadataKey}.metadataDescription`),
  }
}

export default async function PropertiesPage({
  searchParams,
}: LocaleRoutePageProps<
  Record<never, never>,
  NonNullable<SearchResultsRoutePageProps['searchParams']>
>) {
  const resolvedSearchParams = await searchParams
  const selectedPurpose: SearchResultPurpose = getSelectedPurpose(resolvedSearchParams)
  const selectedLocation = getSelectedLocation(resolvedSearchParams)

  return <SearchResultsPage purpose={selectedPurpose} initialLocation={selectedLocation} />
}
