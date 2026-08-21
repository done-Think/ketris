import { cookies } from 'next/headers'

import { SearchResultsPage } from '@modules/marketplace'
import {
  isSearchResultsViewMode,
  searchResultsViewModeCookieKey,
} from '@modules/marketplace/config/search-results-view-mode'

type ImoveisPageProps = {
  searchParams?: {
    finalidade?: string
    localizacao?: string
  }
}

export function generateMetadata({ searchParams }: ImoveisPageProps) {
  const purpose = searchParams?.finalidade === 'comprar' ? 'Comprar' : 'Alugar'

  return {
    title: `Ketris | ${purpose}`,
    description: 'Busque imóveis para alugar e comprar.',
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
