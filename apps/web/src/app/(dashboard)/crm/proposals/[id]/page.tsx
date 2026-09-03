import { notFound } from 'next/navigation'

import { ProposalDetail } from '@modules/proposals/components/ProposalDetail'
import { getProposalManagementDetail } from '@modules/proposals/fixtures/proposal-management-fixtures'
import type { CrmProposalDetailPageProps } from '@modules/proposals/types/proposal-management'

export const metadata = { title: 'Detalhe da Proposta | Ketris' }

export default function CrmProposalDetailPage({ params }: CrmProposalDetailPageProps) {
  if (!getProposalManagementDetail(params.id)) notFound()

  return <ProposalDetail proposalId={params.id} />
}
