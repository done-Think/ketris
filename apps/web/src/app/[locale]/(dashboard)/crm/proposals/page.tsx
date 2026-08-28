import { createLocalizedMetadata } from '@/i18n/metadata'
import { PipelineBoard } from '@modules/crm/components/PipelineBoard'

export const generateMetadata = () => createLocalizedMetadata('crm.metadata.proposals')

export default function CrmProposalsPage() {
  return <PipelineBoard initialStatus="ENVIADA" />
}
