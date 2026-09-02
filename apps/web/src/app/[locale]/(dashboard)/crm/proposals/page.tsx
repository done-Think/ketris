import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { PipelineBoard } from '@modules/crm/components/PipelineBoard'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('crm.metadata.proposals', locale)
}

export default function CrmProposalsPage() {
  return <PipelineBoard initialStatus="ENVIADA" />
}
