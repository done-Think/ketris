import { cookies } from 'next/headers'

import { SearchResultsPage } from '@modules/marketplace'
import {
  isSearchResultsViewMode,
  searchResultsViewModeCookieKey,
} from '@modules/marketplace/config/search-results-view-mode'
import type { SearchResultsRoutePageProps } from '@modules/marketplace/types/search'

export const metadata = {
  title: 'Ketris',
  description: 'Busque imóveis para alugar e comprar.',
}

export default function ImoveisPage({ searchParams }: SearchResultsRoutePageProps) {
  const storedViewMode = cookies().get(searchResultsViewModeCookieKey)?.value
  const selectedPurpose = searchParams?.purpose ?? searchParams?.finalidade
  const selectedLocation = searchParams?.location ?? searchParams?.localizacao

  return (
    <SearchResultsPage
      purpose={selectedPurpose === 'comprar' ? 'comprar' : 'alugar'}
      initialLocation={selectedLocation}
      initialViewMode={isSearchResultsViewMode(storedViewMode) ? storedViewMode : 'grid'}
    />
  )
}
