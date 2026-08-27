import { PipelineBoard } from '@modules/crm/components/PipelineBoard'

export const metadata = { title: 'Ketris | Propostas' }

export default function CrmProposalsPage() {
  return <PipelineBoard initialStatus="ENVIADA" />
}
