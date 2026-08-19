'use client'

import { useMemo, useState } from 'react'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Alert, Box, Button, Stack } from '@mui/material'
import axios from 'axios'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSnackbar } from 'notistack'

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
    interessadoNome: opportunity.interessadoNome,
    interessadoEmail: opportunity.interessadoEmail,
    interessadoTelefone: opportunity.interessadoTelefone ?? '',
    valorProposto: String(opportunity.valorProposto),
    prazoContratoMeses: opportunity.prazoContratoMeses
      ? String(opportunity.prazoContratoMeses)
      : '',
    inicioPretendido: toDateInput(opportunity.inicioPretendido),
    garantiaContratual: opportunity.garantiaContratual,
    condicoesEspeciais: opportunity.condicoesEspeciais.join(', '),
    observacoes: opportunity.observacoes ?? '',
  }
}

export function OpportunityDetail({ opportunityId }: OpportunityDetailProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const tenantId = session?.tenantId
  const opportunityQuery = useOpportunity(tenantId, opportunityId)
  const opportunity = opportunityQuery.data
  const propertyQuery = useCrmProperty(tenantId, opportunity?.imovelId)
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
        key: 'created',
        title: 'Oportunidade criada',
        detail: 'Registro incluído no pipeline.',
        occurredAt: opportunity.createdAt,
      },
    ]

    if (new Date(opportunity.updatedAt).getTime() > new Date(opportunity.createdAt).getTime()) {
      items.unshift({
        key: 'updated',
        title: 'Oportunidade atualizada',
        detail: `Etapa atual: ${opportunityStageByStatus[opportunity.status].label}.`,
        occurredAt: opportunity.updatedAt,
      })
    }

    return items
  }, [opportunity])

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
  const stage = opportunityStageByStatus[currentOpportunity.status]
  const isMutating = updateOpportunity.isPending || archiveOpportunity.isPending
  const property = propertyQuery.data
  const propertyLocation = property
    ? [property.bairro, property.cidade].filter(Boolean).join(' · ') || 'Localização não informada'
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

  function openEditDialog() {
    setEditOpen(true)
  }

  async function saveOpportunity(values: OpportunityEditFormValues) {
    const proposedValue = Number(values.valorProposto)
    const contractMonths = values.prazoContratoMeses ? Number(values.prazoContratoMeses) : null

    try {
      await updateOpportunity.mutateAsync({
        id: currentOpportunity.id,
        changes: {
          interessadoNome: values.interessadoNome.trim(),
          interessadoEmail: values.interessadoEmail.trim(),
          interessadoTelefone: values.interessadoTelefone.trim() || null,
          valorProposto: proposedValue,
          prazoContratoMeses: contractMonths,
          inicioPretendido: values.inicioPretendido || null,
          garantiaContratual: values.garantiaContratual,
          condicoesEspeciais: values.condicoesEspeciais
            .split(',')
            .map((condition) => condition.trim())
            .filter(Boolean),
          observacoes: values.observacoes.trim() || null,
        },
      })
      enqueueSnackbar('Oportunidade atualizada.', { variant: 'success' })
      setEditOpen(false)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Não foi possível atualizar a oportunidade.'), {
        variant: 'error',
      })
    }
  }

  async function confirmArchive() {
    try {
      await archiveOpportunity.mutateAsync(currentOpportunity.id)
      enqueueSnackbar('Oportunidade arquivada.', { variant: 'success' })
      setArchiveOpen(false)
      router.replace('/crm')
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Não foi possível arquivar a oportunidade.'), {
        variant: 'error',
      })
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 2, '& h1, & h2': { letterSpacing: '0 !important' } }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, lg: 3.5 }, pb: { xs: 2, lg: 3 } }}>
        <OpportunityDetailHeader opportunity={opportunity} stage={stage} property={property} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'minmax(0, 58fr) minmax(320px, 42fr)',
            },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <Stack spacing={2} minWidth={0}>
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

          <Stack spacing={2} minWidth={0}>
            <OpportunityActivitiesPanel activities={activities} />
            <OpportunityNextActionsPanel />
          </Stack>
        </Box>
      </Box>

      <OpportunityActionsFooter
        opportunity={opportunity}
        isMutating={isMutating}
        onStageMenuOpen={(event) => setStageMenuAnchor(event.currentTarget)}
        onDiscardLead={() => setNextStatus('RECUSADA')}
        onEdit={openEditDialog}
        onArchive={() => setArchiveOpen(true)}
      />

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
