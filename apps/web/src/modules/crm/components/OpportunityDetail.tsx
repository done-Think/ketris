'use client'

import { useState, type MouseEvent } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import axios from 'axios'
import NextLink from 'next/link'
import { useSession } from 'next-auth/react'
import { useSnackbar } from 'notistack'

import { opportunityStageByStatus, opportunityStages } from '../config/opportunity-stages'
import { getOpportunityDetailFixture } from '../fixtures/opportunity-detail-fixtures'
import { useCrmProperty, useOpportunity, useUpdateOpportunity } from '../hooks/use-opportunities'
import type {
  OpportunityActivityPresentation,
  OpportunityDetailPresentation,
  SuggestedPropertyPresentation,
} from '../types/opportunity-detail'
import type { Opportunity, OpportunityStatus } from '../types/opportunity'
import type { PublicPropertyDetail } from '../types/property'
import {
  formatCurrency,
  formatDate,
  formatMonthlyCurrency,
  formatRelativeDate,
} from '../utils/formatters'
import { OpportunityDetailContent } from './OpportunityDetailContent'

type OpportunityDetailProps = {
  opportunityId: string
}

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }

  return fallback
}

function DetailLoading() {
  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, lg: 3.5 } }} aria-label="Carregando oportunidade">
      <Skeleton width={210} height={18} />
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, mb: 2 }}>
        <Skeleton width="34%" height={42} />
        <Skeleton width={160} height={42} />
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 58fr) minmax(320px, 42fr)' },
          gap: 2.25,
        }}
      >
        <Stack spacing={2.25}>
          <Skeleton variant="rounded" height={206} />
          <Skeleton variant="rounded" height={282} />
        </Stack>
        <Stack spacing={2.25}>
          <Skeleton variant="rounded" height={336} />
          <Skeleton variant="rounded" height={166} />
        </Stack>
      </Box>
    </Box>
  )
}

function buildPropertyMeta(property: PublicPropertyDetail): string {
  const location = [property.bairro, property.cidade].filter(Boolean).join(' · ')

  return [property.tipo, property.areaM2 ? `${property.areaM2}m²` : null, location || null]
    .filter(Boolean)
    .join(' · ')
}

function buildSuggestedProperties(
  property: PublicPropertyDetail | undefined,
): readonly SuggestedPropertyPresentation[] {
  if (!property) return []

  return [
    {
      id: property.id,
      title: property.titulo,
      imageUrl: property.capaUrl ?? undefined,
      meta: buildPropertyMeta(property),
      priceLabel:
        property.finalidade === 'ALUGUEL'
          ? formatMonthlyCurrency(property.valor)
          : formatCurrency(property.valor),
    },
  ]
}

function buildActivities(opportunity: Opportunity): readonly OpportunityActivityPresentation[] {
  const activities: OpportunityActivityPresentation[] = [
    {
      id: 'opportunity-created',
      kind: 'opportunity',
      title: 'Oportunidade criada',
      dateLabel: formatRelativeDate(opportunity.createdAt),
      description: 'Registro incluído no pipeline.',
    },
  ]

  if (new Date(opportunity.updatedAt).getTime() > new Date(opportunity.createdAt).getTime()) {
    activities.unshift({
      id: 'opportunity-updated',
      kind: 'opportunity',
      title: 'Oportunidade atualizada',
      dateLabel: formatRelativeDate(opportunity.updatedAt),
      description: `Etapa atual: ${opportunityStageByStatus[opportunity.status].label}.`,
    })
  }

  return activities
}

function buildDeadlineLabel(opportunity: Opportunity): string {
  const details = [
    opportunity.inicioPretendido ? `Início em ${formatDate(opportunity.inicioPretendido)}` : null,
    opportunity.prazoContratoMeses ? `${opportunity.prazoContratoMeses} meses` : null,
  ].filter(Boolean)

  return details.join(' · ') || 'Não informado'
}

function buildOpportunityPresentation(
  opportunity: Opportunity,
  property: PublicPropertyDetail | undefined,
): OpportunityDetailPresentation {
  const location = property ? [property.bairro, property.cidade].filter(Boolean).join(' / ') : ''
  const interest = property
    ? `${property.titulo}${location ? ` (${location})` : ''}`
    : opportunity.observacoes || 'Não informado'
  const budget =
    property?.finalidade === 'ALUGUEL'
      ? formatMonthlyCurrency(opportunity.valorProposto)
      : formatCurrency(opportunity.valorProposto)

  return {
    interestDetails: {
      interest,
      budget,
      deadline: buildDeadlineLabel(opportunity),
    },
    suggestedProperties: buildSuggestedProperties(property),
    activities: buildActivities(opportunity),
    nextActions: [],
  }
}

export function OpportunityDetail({ opportunityId }: OpportunityDetailProps) {
  const fixture = getOpportunityDetailFixture(opportunityId)
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const opportunityQuery = useOpportunity(tenantId, fixture ? null : opportunityId)
  const opportunity = fixture?.opportunity ?? opportunityQuery.data
  const propertyQuery = useCrmProperty(tenantId, fixture ? null : opportunity?.imovelId)
  const updateOpportunity = useUpdateOpportunity(tenantId ?? '')
  const { enqueueSnackbar } = useSnackbar()
  const [stageMenuAnchor, setStageMenuAnchor] = useState<HTMLElement | null>(null)
  const [nextStatus, setNextStatus] = useState<OpportunityStatus | null>(null)

  if (!fixture && opportunityQuery.isLoading) return <DetailLoading />

  if ((!fixture && opportunityQuery.isError) || !opportunity) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{ minHeight: '65vh', p: 3 }}
      >
        <Alert severity="error" sx={{ maxWidth: 520 }}>
          Não foi possível carregar esta oportunidade.
        </Alert>
        <Button variant="outlined" onClick={() => opportunityQuery.refetch()}>
          Tentar novamente
        </Button>
        <Button component={NextLink} href="/crm" startIcon={<ArrowBackRoundedIcon />}>
          Voltar ao pipeline
        </Button>
      </Stack>
    )
  }

  const currentOpportunity = opportunity
  const property = fixture ? undefined : propertyQuery.data
  const stage = fixture?.stage ?? opportunityStageByStatus[currentOpportunity.status]
  const presentation =
    fixture?.presentation ?? buildOpportunityPresentation(currentOpportunity, property)
  const isMutating = updateOpportunity.isPending
  const actionsDisabled = Boolean(fixture) || !tenantId
  const valueLabel =
    fixture || property?.finalidade === 'ALUGUEL'
      ? formatMonthlyCurrency(currentOpportunity.valorProposto)
      : formatCurrency(currentOpportunity.valorProposto)

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
      enqueueSnackbar(`Oportunidade movida para ${opportunityStageByStatus[nextStatus].label}.`, {
        variant: 'success',
      })
      setNextStatus(null)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Não foi possível atualizar a etapa.'), {
        variant: 'error',
      })
    }
  }

  function openStageMenu(event: MouseEvent<HTMLButtonElement>) {
    if (!actionsDisabled) setStageMenuAnchor(event.currentTarget)
  }

  function discardOpportunity() {
    if (!actionsDisabled) setNextStatus('RECUSADA')
  }

  function addQuickNote() {
    if (actionsDisabled) return

    enqueueSnackbar('Notas rápidas estarão disponíveis em breve.', { variant: 'info' })
  }

  return (
    <>
      <OpportunityDetailContent
        opportunity={currentOpportunity}
        stage={stage}
        presentation={presentation}
        valueLabel={valueLabel}
        suggestionsLoading={!fixture && propertyQuery.isLoading}
        suggestionsError={!fixture && propertyQuery.isError}
        isMutating={isMutating}
        actionsDisabled={actionsDisabled}
        primaryActionLabel={fixture ? 'Mover para Proposta' : 'Mover de etapa'}
        onPrimaryAction={openStageMenu}
        onDiscardOpportunity={discardOpportunity}
        onAddQuickNote={addQuickNote}
        onRetrySuggestions={fixture ? undefined : () => propertyQuery.refetch()}
      />

      <Menu
        anchorEl={stageMenuAnchor}
        open={Boolean(stageMenuAnchor)}
        onClose={() => setStageMenuAnchor(null)}
      >
        {opportunityStages
          .filter(({ status }) => status !== currentOpportunity.status)
          .map((option) => (
            <MenuItem key={option.status} onClick={() => requestStatusChange(option.status)}>
              <Box
                sx={{ width: 8, height: 8, mr: 1.2, borderRadius: '50%', bgcolor: option.color }}
              />
              {option.label}
            </MenuItem>
          ))}
      </Menu>

      <Dialog
        open={Boolean(nextStatus)}
        onClose={() => !updateOpportunity.isPending && setNextStatus(null)}
      >
        <DialogTitle sx={{ letterSpacing: 0 }}>Confirmar mudança de etapa</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {nextStatus
              ? `Mover ${currentOpportunity.interessadoNome} de ${stage.label} para ${opportunityStageByStatus[nextStatus].label}?`
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={updateOpportunity.isPending} onClick={() => setNextStatus(null)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={updateOpportunity.isPending}
            onClick={confirmStatusChange}
          >
            {updateOpportunity.isPending ? <CircularProgress size={20} /> : 'Confirmar mudança'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
