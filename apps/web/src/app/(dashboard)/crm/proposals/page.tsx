import { PipelineBoard } from '@modules/crm/components/PipelineBoard'

export const metadata = { title: 'Propostas | Ketris' }

export default function CrmProposalsPage() {
  return <PipelineBoard initialStatus="ENVIADA" />
}
