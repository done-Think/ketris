'use client'

import {
  crmActivityKey,
  crmStatusKey,
  crmSystemActionKey,
} from '@server/crm/constants/translation-keys'

import * as crmStyles from '../styles/opportunity-detail.styles'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Alert, Box, Button, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'

import { Link, useRouter } from '@/i18n/navigation'
import { opportunityStageByStatus } from '../config/opportunity-stages'
import {
  useArchiveOpportunity,
  useCrmAuthorizedProperty,
  useOpportunity,
  useOpportunityActivities,
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
import { extractErrorMessage } from '@shared/utils/error-message'
import { ArchiveOpportunityDialog } from './opportunity-detail/ArchiveOpportunityDialog'
import { DetailLoading } from './opportunity-detail/DetailLoading'
import { EditOpportunityDialog } from './opportunity-detail/EditOpportunityDialog'
import { OpportunityActionsFooter } from './opportunity-detail/OpportunityActionsFooter'
import { OpportunityActivitiesPanel } from './opportunity-detail/OpportunityActivitiesPanel'
import { OpportunityActivityComposer } from './opportunity-detail/OpportunityActivityComposer'
import { OpportunityContactPanel } from './opportunity-detail/OpportunityContactPanel'
import { OpportunityDetailHeader } from './opportunity-detail/OpportunityDetailHeader'
import { OpportunityNextActionsPanel } from './opportunity-detail/OpportunityNextActionsPanel'
import { OpportunityPropertyPanel } from './opportunity-detail/OpportunityPropertyPanel'
import { OpportunityResponsiblePanel } from './opportunity-detail/OpportunityResponsiblePanel'
import { OpportunityStageMenu } from './opportunity-detail/OpportunityStageMenu'
import { StatusChangeDialog } from './opportunity-detail/StatusChangeDialog'

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

function buildEditValues(opportunity: Opportunity): OpportunityEditFormValues {
  return {
    contact: opportunity.contactId
      ? {
          id: opportunity.contactId,
          name: opportunity.leadName,
          email: opportunity.leadEmail,
          phone: opportunity.leadPhone,
        }
      : null,
    leadName: opportunity.leadName,
    leadEmail: opportunity.leadEmail,
    leadPhone: opportunity.leadPhone ?? '',
    proposedValue: String(opportunity.proposedValue),
    contractTermMonths: opportunity.contractTermMonths
      ? String(opportunity.contractTermMonths)
      : '',
    desiredStartDate: toDateInput(opportunity.desiredStartDate),
    guaranteeType: opportunity.guaranteeType,
    specialConditions: opportunity.specialConditions.map((text) => ({ text })),
    notes: opportunity.notes ?? '',
  }
}

export function OpportunityDetail({ opportunityId }: OpportunityDetailProps) {
  const t = useTranslations('crm.opportunityDetail')
  const pipelineT = useTranslations('crm.pipeline')
  const { data: session } = useSession()
  const router = useRouter()
  const opportunityQuery = useOpportunity(opportunityId)
  const activitiesQuery = useOpportunityActivities(opportunityId)
  const opportunity = opportunityQuery.data
  const propertyQuery = useCrmAuthorizedProperty(opportunity?.propertyId)
  const updateOpportunity = useUpdateOpportunity()
  const archiveOpportunity = useArchiveOpportunity()
  const { enqueueSnackbar } = useSnackbar()
  const [stageMenuAnchor, setStageMenuAnchor] = useState<HTMLElement | null>(null)
  const [nextStatus, setNextStatus] = useState<OpportunityStatus | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const activities = useMemo<OpportunityActivitiesPanelProps['activities']>(
    () =>
      (activitiesQuery.data ?? []).map((activity) => {
        const legacyStatus =
          activity.type === 'STATUS_CHANGE' &&
          activity.previousStatus &&
          activity.newStatus &&
          activity.description ===
            `Status alterado de ${activity.previousStatus} para ${activity.newStatus}.`
        const actionKey =
          crmSystemActionKey(activity.systemAction) ?? (legacyStatus ? 'statusChanged' : null)
        const description = legacyStatus ? '' : activity.description
        return {
          key: activity.id,
          title: t(`activityTypes.${crmActivityKey(activity.type)}`),
          detail: actionKey
            ? t(`activityActions.${actionKey}`, {
                previous: activity.previousStatus
                  ? t(`statuses.${crmStatusKey(activity.previousStatus)}`)
                  : '',
                next: activity.newStatus ? t(`statuses.${crmStatusKey(activity.newStatus)}`) : '',
              }) + (description ? ` ${description}` : '')
            : description,
          occurredAt: activity.createdAt,
        }
      }),
    [activitiesQuery.data, t],
  )

  const nextActions = useMemo<OpportunityNextAction[]>(() => {
    if (!opportunity) return []

    if (opportunity.status === 'DRAFT') {
      return [
        {
          key: 'complete-draft',
          title: t('nextActions.completeDraft.title'),
          detail: t('nextActions.completeDraft.detail'),
          tone: 'warning',
        },
        {
          key: 'send-proposal',
          title: t('nextActions.sendProposal.title'),
          detail: t('nextActions.sendProposal.detail'),
          tone: 'info',
        },
      ]
    }

    if (opportunity.status === 'SENT') {
      return [
        {
          key: 'proposal-follow-up',
          title: t('nextActions.proposalFollowUp.title'),
          detail: t('nextActions.proposalFollowUp.detail'),
          tone: 'warning',
        },
        {
          key: 'validate-documents',
          title: t('nextActions.validateDocuments.title'),
          detail: t('nextActions.validateDocuments.detail'),
          tone: 'info',
        },
        {
          key: 'schedule-visit',
          title: t('nextActions.scheduleVisit.title'),
          detail: t('nextActions.scheduleVisit.detail'),
          tone: 'info',
        },
        {
          key: 'align-owner-feedback',
          title: t('nextActions.alignOwnerFeedback.title'),
          detail: t('nextActions.alignOwnerFeedback.detail'),
          tone: 'info',
        },
      ]
    }

    if (opportunity.status === 'IN_NEGOTIATION') {
      return [
        {
          key: 'review-counteroffer',
          title: t('nextActions.reviewCounteroffer.title'),
          detail: t('nextActions.reviewCounteroffer.detail'),
          tone: 'warning',
        },
        {
          key: 'align-terms',
          title: t('nextActions.alignTerms.title'),
          detail: t('nextActions.alignTerms.detail'),
          tone: 'info',
        },
      ]
    }

    if (opportunity.status === 'ACCEPTED') {
      return [
        {
          key: 'prepare-contract',
          title: t('nextActions.prepareContract.title'),
          detail: t('nextActions.prepareContract.detail'),
          tone: 'success',
        },
        {
          key: 'confirm-signature',
          title: t('nextActions.confirmSignature.title'),
          detail: t('nextActions.confirmSignature.detail'),
          tone: 'info',
        },
      ]
    }

    return [
      {
        key: 'register-loss-reason',
        title: t('nextActions.registerLossReason.title'),
        detail: t('nextActions.registerLossReason.detail'),
        tone: 'warning',
      },
    ]
  }, [opportunity, t])

  if (opportunityQuery.isLoading) return <DetailLoading />

  if (!opportunity) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={2} sx={crmStyles.stackSx}>
        <Alert severity="error" sx={crmStyles.alertSx}>
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
      enqueueSnackbar(extractErrorMessage(error, t('updateStageError')), {
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
          contactId: values.contact?.id ?? null,
          leadName: values.leadName.trim(),
          leadEmail: values.leadEmail.trim(),
          leadPhone: values.leadPhone.trim() || null,
          proposedValue: proposedValue,
          contractTermMonths: contractMonths,
          desiredStartDate: values.desiredStartDate || null,
          guaranteeType: values.guaranteeType,
          specialConditions: values.specialConditions.map(({ text }) => text.trim()),
          notes: values.notes.trim() || null,
        },
      })
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
      setEditOpen(false)
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('updateError')), {
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
      enqueueSnackbar(extractErrorMessage(error, t('archiveError')), {
        variant: 'error',
      })
    }
  }

  return (
    <Box sx={crmStyles.boxSx}>
      {opportunityQuery.isError && (
        <Alert
          severity="error"
          action={
            <Button onClick={() => void opportunityQuery.refetch()}>{pipelineT('retry')}</Button>
          }
        >
          {t('loadError')}
        </Alert>
      )}
      <OpportunityDetailHeader opportunity={opportunity} stage={stage} />

      <Box sx={crmStyles.boxSx2}>
        <Stack spacing={2} minWidth={0} sx={crmStyles.stackSx2}>
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

        <Stack spacing={2} minWidth={0} sx={crmStyles.stackSx2}>
          <OpportunityResponsiblePanel
            opportunity={opportunity}
            canManage={session?.role === 'OWNER'}
          />
          <OpportunityNextActionsPanel actions={nextActions} />
        </Stack>

        <Stack spacing={2} minWidth={0} sx={crmStyles.stackSx3}>
          {!opportunity.archivedAt && (
            <OpportunityActivityComposer opportunityId={opportunity.id} />
          )}
          {activitiesQuery.isError ? (
            <Alert
              severity="error"
              action={
                <Button onClick={() => void activitiesQuery.refetch()}>{pipelineT('retry')}</Button>
              }
            >
              {t('activitiesLoadError')}
            </Alert>
          ) : (
            <OpportunityActivitiesPanel
              activities={activities}
              isLoading={activitiesQuery.isLoading}
            />
          )}
        </Stack>
      </Box>

      <Box sx={crmStyles.boxSx3}>
        <OpportunityActionsFooter
          opportunity={opportunity}
          isMutating={isMutating}
          onStageMenuOpen={(event) => setStageMenuAnchor(event.currentTarget)}
          onDiscardLead={() => setNextStatus('REJECTED')}
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
        key={currentOpportunity.id}
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
