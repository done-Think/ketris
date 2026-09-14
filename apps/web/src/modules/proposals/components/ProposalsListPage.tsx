'use client'

import { useMemo, useState } from 'react'
import { Alert, Button, CircularProgress, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import { CreateOpportunityDialog } from '@modules/crm/components/opportunity-detail/CreateOpportunityDialog'
import {
  useCreateOpportunity,
  useCrmProperties,
  useOpportunities,
} from '@modules/crm/hooks/use-opportunities'
import type { CreateOpportunityFormValues } from '@modules/crm/types/opportunity'
import { errorMessage } from '@modules/crm/utils/error-message'
import { useSnackbar } from 'notistack'

import type { ProposalManagementListItem } from '../types/proposal-management'
import {
  buildProposalManagementSummary,
  mapOpportunityToProposalListItem,
} from '../utils/opportunity-adapter'
import { ProposalsList } from './ProposalsList'

export function ProposalsListPage() {
  const t = useTranslations('crm.opportunityDetail')
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const opportunitiesQuery = useOpportunities(tenantId)
  const propertiesQuery = useCrmProperties(tenantId)
  const createOpportunity = useCreateOpportunity(tenantId ?? '')

  const propertiesById = useMemo(
    () => new Map((propertiesQuery.data ?? []).map((property) => [property.id, property])),
    [propertiesQuery.data],
  )

  const proposals = useMemo(
    () =>
      (opportunitiesQuery.data ?? []).map((opportunity) =>
        mapOpportunityToProposalListItem(
          opportunity,
          propertiesById.get(opportunity.propertyId),
          opportunity.propertyId,
        ),
      ),
    [opportunitiesQuery.data, propertiesById],
  )

  const summary = useMemo(() => buildProposalManagementSummary(proposals), [proposals])

  function goToProposal(proposal: ProposalManagementListItem) {
    router.push({ pathname: '/crm/proposals/[id]', params: { id: proposal.id } })
  }

  async function handleCreateOpportunity(values: CreateOpportunityFormValues) {
    try {
      await createOpportunity.mutateAsync({
        propertyId: values.propertyId,
        leadName: values.leadName.trim(),
        leadEmail: values.leadEmail.trim(),
        leadPhone: values.leadPhone.trim() || null,
        proposedValue: Number(values.proposedValue),
        notes: values.notes.trim() || null,
        status: values.status,
      })
      enqueueSnackbar(t('createSuccess'), { variant: 'success' })
      setIsCreateOpen(false)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('createError')), { variant: 'error' })
    }
  }

  if (opportunitiesQuery.isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
        <CircularProgress size={28} />
      </Stack>
    )
  }

  if (opportunitiesQuery.isError) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh', p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => opportunitiesQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        >
          Não foi possível carregar as propostas.
        </Alert>
      </Stack>
    )
  }

  return (
    <>
      <ProposalsList
        proposals={proposals}
        summary={summary}
        onNewProposal={() => setIsCreateOpen(true)}
        onViewProposal={goToProposal}
      />

      <CreateOpportunityDialog
        open={isCreateOpen}
        tenantId={tenantId ?? ''}
        isPending={createOpportunity.isPending}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateOpportunity}
      />
    </>
  )
}
