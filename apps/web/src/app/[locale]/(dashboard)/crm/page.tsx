import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { SalesPipelineBoard } from '@modules/crm/components/SalesPipelineBoard'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('crm.metadata.pipeline', locale)
}

export default async function CrmPipelinePage() {
  return <SalesPipelineBoard />
}
