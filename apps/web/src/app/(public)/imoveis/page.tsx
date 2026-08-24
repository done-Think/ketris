import { SearchResultsPage } from '@modules/marketplace'

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
  return (
    <SearchResultsPage
      purpose={searchParams?.finalidade === 'comprar' ? 'comprar' : 'alugar'}
      initialLocation={searchParams?.localizacao}
    />
  )
}
