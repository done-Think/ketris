import { SearchResultsPage } from '@modules/marketplace'
import type { ImoveisPageProps } from '@modules/marketplace/types'

export const metadata = {
  title: 'Ketris',
  description: 'Busque imóveis para alugar e comprar.',
}

export default function ImoveisPage({ searchParams }: ImoveisPageProps) {
  return (
    <SearchResultsPage
      purpose={searchParams?.finalidade === 'comprar' ? 'comprar' : 'alugar'}
      initialLocation={searchParams?.localizacao}
    />
  )
}
