import { getTranslations } from 'next-intl/server'

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

export async function generateMetadata({ searchParams }: SearchResultsRoutePageProps) {
  const t = await getTranslations('marketplace.metadata')
  const metadataKey = getSelectedPurpose(searchParams) === 'comprar' ? 'searchBuy' : 'searchRent'

  return {
    title: t(`${metadataKey}.metadataTitle`),
    description: t(`${metadataKey}.metadataDescription`),
  }
}

export default function PropertiesPage({ searchParams }: SearchResultsRoutePageProps) {
  const selectedPurpose: SearchResultPurpose = getSelectedPurpose(searchParams)
  const selectedLocation = getSelectedLocation(searchParams)

  return <SearchResultsPage purpose={selectedPurpose} initialLocation={selectedLocation} />
}
