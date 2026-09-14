'use client'

import { CircularProgress, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useCrmProperty, useOpportunity } from '@modules/crm/hooks/use-opportunities'

import { mapOpportunityToProposalDetail } from '../utils/opportunity-adapter'
import { ProposalDetail } from './ProposalDetail'

export type ProposalDetailPageProps = {
  proposalId: string
}

export function ProposalDetailPage({ proposalId }: ProposalDetailPageProps) {
  const t = useTranslations('crm.opportunityDetail')
  const { data: session } = useSession()
  const tenantId = session?.tenantId

  const opportunityQuery = useOpportunity(tenantId, proposalId)
  const opportunity = opportunityQuery.data
  const propertyQuery = useCrmProperty(tenantId, opportunity?.propertyId)

  if (opportunityQuery.isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
        <CircularProgress size={28} />
      </Stack>
    )
  }

  const detail = opportunity
    ? mapOpportunityToProposalDetail(
        opportunity,
        propertyQuery.data,
        opportunity.propertyId,
        (key) => t(key),
        (key, values) => t(key, values),
        '—',
      )
    : null

  return <ProposalDetail proposalId={proposalId} detail={detail} />
}
