import { SalesPipelineBoard } from '@modules/crm/components/SalesPipelineBoard'

export const metadata = { title: 'Ketris | Pipeline de Vendas' }

type CrmPipelinePageProps = {
  searchParams?: { preview?: string | string[] }
}

export default function CrmPipelinePage({ searchParams }: CrmPipelinePageProps) {
  return <SalesPipelineBoard preview={searchParams?.preview === '1'} />
}
