import { createLocalizedMetadata } from '@/i18n/metadata'
import { SalesPipelineBoard } from '@modules/crm/components/SalesPipelineBoard'

export const generateMetadata = () => createLocalizedMetadata('crm.metadata.pipeline')

type CrmPipelinePageProps = {
  searchParams?: { preview?: string | string[] }
}

export default function CrmPipelinePage({ searchParams }: CrmPipelinePageProps) {
  return <SalesPipelineBoard preview={searchParams?.preview === '1'} />
}
