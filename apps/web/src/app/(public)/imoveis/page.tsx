import { SearchResultsPage } from '@modules/marketplace'

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
  return (
    <SearchResultsPage
      purpose={searchParams?.finalidade === 'comprar' ? 'comprar' : 'alugar'}
      initialLocation={searchParams?.localizacao}
    />
  )
}
