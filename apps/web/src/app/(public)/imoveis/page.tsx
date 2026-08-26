import { SearchResultsPage } from '@modules/marketplace'
import type { SearchResultsRoutePageProps } from '@modules/marketplace/types/search'

function getSelectedPurpose(searchParams: SearchResultsRoutePageProps['searchParams']) {
  return searchParams?.purpose
}

function getSelectedLocation(searchParams: SearchResultsRoutePageProps['searchParams']) {
  return searchParams?.location
}

export function generateMetadata({ searchParams }: SearchResultsRoutePageProps) {
  const purpose = getSelectedPurpose(searchParams) === 'comprar' ? 'Comprar' : 'Alugar'

  return {
    title: `Ketris | ${purpose}`,
    description: 'Busque imóveis para alugar e comprar.',
  }
}

export default function ImoveisPage({ searchParams }: SearchResultsRoutePageProps) {
  const selectedPurpose = getSelectedPurpose(searchParams)
  const selectedLocation = getSelectedLocation(searchParams)

  return (
    <SearchResultsPage
      purpose={selectedPurpose === 'comprar' ? 'comprar' : 'alugar'}
      initialLocation={selectedLocation}
    />
  )
}
