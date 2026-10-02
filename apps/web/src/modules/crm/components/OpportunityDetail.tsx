'use client'

import { useMemo, useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Alert, Box, Button, Stack } from '@mui/material'
import axios from 'axios'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { Link, useRouter } from '@/i18n/navigation'
import { opportunityStageByStatus } from '../config/opportunity-stages'
import {
  useArchiveOpportunity,
  useCrmProperty,
  useOpportunity,
  useUpdateOpportunity,
} from '../hooks/use-opportunities'
import type {
  Opportunity,
  OpportunityEditFormValues,
  OpportunityStatus,
} from '../types/opportunity'
import type {
  OpportunityActivitiesPanelProps,
  OpportunityDetailProps,
  OpportunityNextAction,
} from '../types/opportunity-detail'
import { ArchiveOpportunityDialog } from './opportunity-detail/ArchiveOpportunityDialog'
import { DetailLoading } from './opportunity-detail/DetailLoading'
import { EditOpportunityDialog } from './opportunity-detail/EditOpportunityDialog'
import { OpportunityActionsFooter } from './opportunity-detail/OpportunityActionsFooter'
import { OpportunityActivitiesPanel } from './opportunity-detail/OpportunityActivitiesPanel'
import { OpportunityContactPanel } from './opportunity-detail/OpportunityContactPanel'
import { OpportunityDetailHeader } from './opportunity-detail/OpportunityDetailHeader'
import { OpportunityNextActionsPanel } from './opportunity-detail/OpportunityNextActionsPanel'
import { OpportunityPropertyPanel } from './opportunity-detail/OpportunityPropertyPanel'
import { OpportunityStageMenu } from './opportunity-detail/OpportunityStageMenu'
import { StatusChangeDialog } from './opportunity-detail/StatusChangeDialog'

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }

  return fallback
}

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

function buildEditValues(opportunity: Opportunity): OpportunityEditFormValues {
  return {
    leadName: opportunity.leadName,
    leadEmail: opportunity.leadEmail,
    leadPhone: opportunity.leadPhone ?? '',
    proposedValue: String(opportunity.proposedValue),
    contractTermMonths: opportunity.contractTermMonths
      ? String(opportunity.contractTermMonths)
      : '',
    desiredStartDate: toDateInput(opportunity.desiredStartDate),
    guaranteeType: opportunity.guaranteeType,
    specialConditions: opportunity.specialConditions.join(', '),
    notes: opportunity.notes ?? '',
  }
}

function addDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

export function OpportunityDetail({ opportunityId }: OpportunityDetailProps) {
  const t = useTranslations('crm.opportunityDetail')
  const pipelineT = useTranslations('crm.pipeline')
  const { data: session } = useSession()
  const router = useRouter()
  const tenantId = session?.tenantId
  const opportunityQuery = useOpportunity(tenantId, opportunityId)
  const opportunity = opportunityQuery.data
  const propertyQuery = useCrmProperty(tenantId, opportunity?.propertyId)
  const updateOpportunity = useUpdateOpportunity(tenantId ?? '')
  const archiveOpportunity = useArchiveOpportunity(tenantId ?? '')
  const { enqueueSnackbar } = useSnackbar()
  const [stageMenuAnchor, setStageMenuAnchor] = useState<HTMLElement | null>(null)
  const [nextStatus, setNextStatus] = useState<OpportunityStatus | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const activities = useMemo<OpportunityActivitiesPanelProps['activities']>(() => {
    if (!opportunity) return []

    const items = [
      {
        key: 'proposal-sent',
        title: t('proposalSentActivityTitle'),
        detail: t('proposalSentActivityDetail'),
        occurredAt: addDays(-1),
      },
      {
        key: 'follow-up',
        title: t('followUpActivityTitle'),
        detail: t('followUpActivityDetail'),
        occurredAt: addDays(-2),
      },
      {
        key: 'property-linked',
        title: t('propertyLinkedActivityTitle'),
        detail: t('propertyLinkedActivityDetail'),
        occurredAt: addDays(-3),
      },
      {
        key: 'documents-requested',
        title: t('documentsRequestedActivityTitle'),
        detail: t('documentsRequestedActivityDetail'),
        occurredAt: addDays(-4),
      },
      {
        key: 'created',
        title: t('createdActivityTitle'),
        detail: t('createdActivityDetail'),
        occurredAt: opportunity.createdAt,
      },
    ]

    if (new Date(opportunity.updatedAt).getTime() > new Date(opportunity.createdAt).getTime()) {
      items.unshift({
        key: 'updated',
        title: t('updatedActivityTitle'),
        detail: t('updatedActivityDetail', {
          stage: pipelineT(`stages.${opportunityStageByStatus[opportunity.status].labelKey}`),
        }),
        occurredAt: opportunity.updatedAt,
      })
    }

    return items
  }, [opportunity, pipelineT, t])

  const nextActions = useMemo<OpportunityNextAction[]>(() => {
    if (!opportunity) return []

    if (opportunity.status === 'RASCUNHO') {
      return [
        {
          key: 'complete-draft',
          title: t('nextActions.completeDraft.title'),
          detail: t('nextActions.completeDraft.detail'),
          dueAt: addDays(1),
          tone: 'warning',
        },
        {
          key: 'send-proposal',
          title: t('nextActions.sendProposal.title'),
          detail: t('nextActions.sendProposal.detail'),
          dueAt: addDays(2),
          tone: 'info',
        },
      ]
    }

    if (opportunity.status === 'ENVIADA') {
      return [
        {
          key: 'proposal-follow-up',
          title: t('nextActions.proposalFollowUp.title'),
          detail: t('nextActions.proposalFollowUp.detail'),
          dueAt: addDays(1),
          tone: 'warning',
        },
        {
          key: 'validate-documents',
          title: t('nextActions.validateDocuments.title'),
          detail: t('nextActions.validateDocuments.detail'),
          dueAt: addDays(2),
          tone: 'info',
        },
        {
          key: 'schedule-visit',
          title: t('nextActions.scheduleVisit.title'),
          detail: t('nextActions.scheduleVisit.detail'),
          dueAt: addDays(3),
          tone: 'info',
        },
        {
          key: 'align-owner-feedback',
          title: t('nextActions.alignOwnerFeedback.title'),
          detail: t('nextActions.alignOwnerFeedback.detail'),
          dueAt: addDays(4),
          tone: 'info',
        },
      ]
    }

    if (opportunity.status === 'EM_NEGOCIACAO') {
      return [
        {
          key: 'review-counteroffer',
          title: t('nextActions.reviewCounteroffer.title'),
          detail: t('nextActions.reviewCounteroffer.detail'),
          dueAt: addDays(1),
          tone: 'warning',
        },
        {
          key: 'align-terms',
          title: t('nextActions.alignTerms.title'),
          detail: t('nextActions.alignTerms.detail'),
          dueAt: addDays(2),
          tone: 'info',
        },
      ]
    }

    if (opportunity.status === 'ACEITA') {
      return [
        {
          key: 'prepare-contract',
          title: t('nextActions.prepareContract.title'),
          detail: t('nextActions.prepareContract.detail'),
          dueAt: addDays(1),
          tone: 'success',
        },
        {
          key: 'confirm-signature',
          title: t('nextActions.confirmSignature.title'),
          detail: t('nextActions.confirmSignature.detail'),
          dueAt: addDays(3),
          tone: 'info',
        },
      ]
    }

    return [
      {
        key: 'register-loss-reason',
        title: t('nextActions.registerLossReason.title'),
        detail: t('nextActions.registerLossReason.detail'),
        dueAt: addDays(1),
        tone: 'warning',
      },
    ]
  }, [opportunity, t])

  if (opportunityQuery.isLoading) return <DetailLoading />

  if (opportunityQuery.isError || !opportunity) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{ minHeight: '65vh', p: 3 }}
      >
        <Alert severity="error" sx={{ maxWidth: 520 }}>
          {t('loadError')}
        </Alert>
        <Button variant="outlined" onClick={() => opportunityQuery.refetch()}>
          {pipelineT('retry')}
        </Button>
        <Button component={Link} href="/crm" startIcon={<ArrowBackRoundedIcon />}>
          {t('backToPipeline')}
        </Button>
      </Stack>
    )
  }

  const currentOpportunity = opportunity
  const stage = opportunityStageByStatus[currentOpportunity.status]
  const isMutating = updateOpportunity.isPending || archiveOpportunity.isPending
  const property = propertyQuery.data
  const propertyLocation = property
    ? [property.neighborhood, property.city].filter(Boolean).join(' · ') || t('unknownLocation')
    : ''

  function requestStatusChange(status: OpportunityStatus) {
    setStageMenuAnchor(null)
    setNextStatus(status)
  }

  async function confirmStatusChange() {
    if (!nextStatus) return

    try {
      await updateOpportunity.mutateAsync({
        id: currentOpportunity.id,
        changes: { status: nextStatus },
      })
      enqueueSnackbar(
        t('movedSuccess', {
          stage: pipelineT(`stages.${opportunityStageByStatus[nextStatus].labelKey}`),
        }),
        { variant: 'success' },
      )
      setNextStatus(null)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('updateStageError')), {
        variant: 'error',
      })
    }
  }

  function openEditDialog() {
    setEditOpen(true)
  }

  async function saveOpportunity(values: OpportunityEditFormValues) {
    const proposedValue = Number(values.proposedValue)
    const contractMonths = values.contractTermMonths ? Number(values.contractTermMonths) : null

    try {
      await updateOpportunity.mutateAsync({
        id: currentOpportunity.id,
        changes: {
          leadName: values.leadName.trim(),
          leadEmail: values.leadEmail.trim(),
          leadPhone: values.leadPhone.trim() || null,
          proposedValue: proposedValue,
          contractTermMonths: contractMonths,
          desiredStartDate: values.desiredStartDate || null,
          guaranteeType: values.guaranteeType,
          specialConditions: values.specialConditions
            .split(',')
            .map((condition) => condition.trim())
            .filter(Boolean),
          notes: values.notes.trim() || null,
        },
      })
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
      setEditOpen(false)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('updateError')), {
        variant: 'error',
      })
    }
  }

  async function confirmArchive() {
    try {
      await archiveOpportunity.mutateAsync(currentOpportunity.id)
      enqueueSnackbar(t('archiveSuccess'), { variant: 'success' })
      setArchiveOpen(false)
      router.replace('/crm')
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('archiveError')), {
        variant: 'error',
      })
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        p: 3.5,
        '& h1, & h2': { letterSpacing: '0 !important' },
      }}
    >
      <OpportunityDetailHeader opportunity={opportunity} stage={stage} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 2,
          alignItems: 'stretch',
          flex: { lg: 1 },
        }}
      >
        <Stack spacing={2} minWidth={0} sx={{ height: '100%' }}>
          <OpportunityContactPanel opportunity={opportunity} />
          <OpportunityPropertyPanel
            opportunity={opportunity}
            property={property}
            propertyLocation={propertyLocation}
            isLoading={propertyQuery.isLoading}
            isError={propertyQuery.isError}
            onRetry={() => propertyQuery.refetch()}
          />
        </Stack>

        <Stack spacing={2} minWidth={0} sx={{ height: '100%' }}>
          <OpportunityNextActionsPanel actions={nextActions} />
        </Stack>

        <Stack spacing={2} minWidth={0} sx={{ height: { lg: '100%' } }}>
          <OpportunityActivitiesPanel activities={activities} />
        </Stack>
      </Box>

      <Box sx={{ mt: 'auto', pt: 2 }}>
        <OpportunityActionsFooter
          opportunity={opportunity}
          isMutating={isMutating}
          onStageMenuOpen={(event) => setStageMenuAnchor(event.currentTarget)}
          onDiscardLead={() => setNextStatus('RECUSADA')}
          onEdit={openEditDialog}
          onArchive={() => setArchiveOpen(true)}
        />
      </Box>

      <OpportunityStageMenu
        anchorEl={stageMenuAnchor}
        opportunity={opportunity}
        onClose={() => setStageMenuAnchor(null)}
        onRequestStatusChange={requestStatusChange}
      />

      <StatusChangeDialog
        nextStatus={nextStatus}
        opportunity={opportunity}
        stage={stage}
        isPending={updateOpportunity.isPending}
        onClose={() => setNextStatus(null)}
        onConfirm={confirmStatusChange}
      />

      <EditOpportunityDialog
        open={editOpen}
        initialValues={editOpen ? buildEditValues(currentOpportunity) : null}
        isPending={updateOpportunity.isPending}
        onClose={() => setEditOpen(false)}
        onSave={saveOpportunity}
      />

      <ArchiveOpportunityDialog
        open={archiveOpen}
        isPending={archiveOpportunity.isPending}
        onClose={() => setArchiveOpen(false)}
        onConfirm={confirmArchive}
      />
    </Box>
  )
}
