import { cookies } from 'next/headers'

import { SearchResultsPage } from '@modules/marketplace'
import {
  isSearchResultsViewMode,
  searchResultsViewModeCookieKey,
} from '@modules/marketplace/config/search-results-view-mode'

export const metadata = {
  title: 'Ketris',
  description: 'Busque imóveis para alugar e comprar.',
}

type ImoveisPageProps = {
  searchParams?: {
    finalidade?: string
    localizacao?: string
  }
}

export default function ImoveisPage({ searchParams }: ImoveisPageProps) {
  const storedViewMode = cookies().get(searchResultsViewModeCookieKey)?.value

  return (
    <SearchResultsPage
      purpose={searchParams?.finalidade === 'comprar' ? 'comprar' : 'alugar'}
      initialLocation={searchParams?.localizacao}
      initialViewMode={isSearchResultsViewMode(storedViewMode) ? storedViewMode : 'grid'}
    />
  )
}
