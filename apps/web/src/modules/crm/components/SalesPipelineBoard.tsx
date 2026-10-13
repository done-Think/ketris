'use client'

import { useMemo, useState } from 'react'
import { Alert, Box, Button } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'
import { surface } from '@shared/theme/tokens'

import { salesPipelineStages, visibleSalesPipelineStatuses } from '../config/sales-pipeline-stages'
import {
  useCreateOpportunity,
  useCrmProperties,
  useOpportunities,
} from '../hooks/use-opportunities'
import type { CreateOpportunityFormValues } from '../types/opportunity'
import type { SalesPipelineStageId, SalesPipelineViewMode } from '../types/sales-pipeline'
import { errorMessage } from '../utils/error-message'
import { getOpportunityStageId, matchesSalesPipelineSearch } from '../utils/sales-pipeline'
import type {
  ProposalManagementFilterId,
  ProposalManagementListItem,
} from '../types/proposal-management'
import {
  buildProposalManagementSummary,
  mapOpportunityToProposalListItem,
} from '../utils/opportunity-adapter'
import {
  proposalManagementDefaultPageSize,
  queryProposalManagementItems,
} from '../utils/proposal-management'
import { CreateOpportunityDialog } from './opportunity-detail/CreateOpportunityDialog'
import { SalesPipelineKanbanView } from './SalesPipelineKanbanView'
import { SalesPipelineListView } from './SalesPipelineListView'
import { SalesPipelineToolbar } from './sales-pipeline-board/SalesPipelineToolbar'

const pipelineBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'
const pipelineViewModeStorageKey = 'ketris.crm.pipeline.viewMode'

function isSalesPipelineViewMode(value: string | null): value is SalesPipelineViewMode {
  return value === 'kanban' || value === 'list'
}

function getInitialPipelineViewMode(): SalesPipelineViewMode {
  if (typeof window === 'undefined') return 'kanban'

  try {
    const storedViewMode = window.localStorage.getItem(pipelineViewModeStorageKey)

    return isSalesPipelineViewMode(storedViewMode) ? storedViewMode : 'kanban'
  } catch {
    return 'kanban'
  }
}

export function SalesPipelineBoard() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.pipeline')
  const tProposalStatuses = useTranslations('crm.opportunityDetail.statuses')
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const tenantId = session?.tenantId ?? ''
  const [search, setSearch] = useState('')
  const [selectedStageId, setSelectedStageId] = useState<SalesPipelineStageId | null>(null)
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<SalesPipelineViewMode>(getInitialPipelineViewMode)
  const [proposalStatus, setProposalStatus] = useState<ProposalManagementFilterId>('all')
  const [proposalPageIndex, setProposalPageIndex] = useState(1)
  const [proposalRowsPerPage, setProposalRowsPerPage] = useState(proposalManagementDefaultPageSize)
  const { enqueueSnackbar } = useSnackbar()

  const opportunitiesQuery = useOpportunities(tenantId)
  const propertiesQuery = useCrmProperties(tenantId)
  const createOpportunity = useCreateOpportunity(tenantId)

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

  const propertiesById = useMemo(
    () => new Map((propertiesQuery.data ?? []).map((property) => [property.id, property])),
    [propertiesQuery.data],
  )

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const visibleOpportunities = useMemo(() => {
    const opportunities = opportunitiesQuery.data ?? []

    return opportunities.filter((opportunity) => {
      if (!visibleSalesPipelineStatuses.has(opportunity.status)) return false

      const stageId = getOpportunityStageId(opportunity)
      if (!stageId || (selectedStageId && stageId !== selectedStageId)) return false

      return matchesSalesPipelineSearch(
        opportunity,
        propertiesById.get(opportunity.propertyId),
        normalizedSearch,
      )
    })
  }, [normalizedSearch, opportunitiesQuery.data, propertiesById, selectedStageId])

  const proposalItems = useMemo<readonly ProposalManagementListItem[]>(() => {
    return (opportunitiesQuery.data ?? []).map((opportunity) =>
      mapOpportunityToProposalListItem(
        opportunity,
        propertiesById.get(opportunity.propertyId),
        opportunity.propertyId,
        locale,
      ),
    )
  }, [opportunitiesQuery.data, propertiesById, locale])

  const proposalSummary = useMemo(
    () => buildProposalManagementSummary(proposalItems, locale),
    [proposalItems, locale],
  )

  const proposalPageResult = useMemo(
    () =>
      queryProposalManagementItems(proposalItems, {
        search,
        status: proposalStatus,
        page: proposalPageIndex,
        pageSize: proposalRowsPerPage,
        statusLabel: (status) => tProposalStatuses(status),
      }),
    [
      proposalItems,
      proposalPageIndex,
      proposalRowsPerPage,
      proposalStatus,
      search,
      tProposalStatuses,
    ],
  )

  function goToOpportunity(proposal: ProposalManagementListItem) {
    router.push({ pathname: '/crm/opportunities/[id]', params: { id: proposal.id } })
  }

  function handleViewModeChange(nextViewMode: SalesPipelineViewMode) {
    setViewMode(nextViewMode)

    try {
      window.localStorage.setItem(pipelineViewModeStorageKey, nextViewMode)
    } catch {}
  }

  const selectedStage = selectedStageId
    ? salesPipelineStages.find((stage) => stage.id === selectedStageId)
    : null
  const isPipelineLoading =
    sessionStatus === 'loading' || opportunitiesQuery.isLoading || propertiesQuery.isLoading
  const hasPipelineError = opportunitiesQuery.isError || propertiesQuery.isError

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: 3.5,
        bgcolor: surface.app,
        overflow: 'hidden',
        fontFamily: pipelineBodyFontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root': {
          fontFamily: pipelineBodyFontFamily,
        },
        '& h1.MuiTypography-root': {
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        },
      }}
    >
      <SalesPipelineToolbar
        search={search}
        selectedStage={selectedStage}
        selectedStageId={selectedStageId}
        filterAnchor={filterAnchor}
        viewMode={viewMode}
        onSearchChange={setSearch}
        onFilterOpen={setFilterAnchor}
        onFilterClose={() => setFilterAnchor(null)}
        onStageSelect={(stageId) => {
          setSelectedStageId(stageId)
          setFilterAnchor(null)
        }}
        onNewOpportunity={() => setIsCreateOpen(true)}
        onViewModeChange={handleViewModeChange}
      />

      <CreateOpportunityDialog
        open={isCreateOpen}
        tenantId={tenantId}
        isPending={createOpportunity.isPending}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateOpportunity}
      />

      {hasPipelineError ? (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (opportunitiesQuery.isError) void opportunitiesQuery.refetch()
                if (propertiesQuery.isError) void propertiesQuery.refetch()
              }}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('dataLoadError')}
        </Alert>
      ) : viewMode === 'kanban' ? (
        <SalesPipelineKanbanView
          visibleOpportunities={visibleOpportunities}
          propertiesById={propertiesById}
          isPipelineLoading={isPipelineLoading}
          hasPipelineError={hasPipelineError}
        />
      ) : (
        <SalesPipelineListView
          proposalStatus={proposalStatus}
          proposalSummary={proposalSummary}
          onStatusChange={(nextStatus) => {
            setProposalStatus(nextStatus)
            setProposalPageIndex(1)
          }}
          proposalPageResult={proposalPageResult}
          proposalRowsPerPage={proposalRowsPerPage}
          onPageChange={setProposalPageIndex}
          onRowsPerPageChange={(nextRowsPerPage) => {
            setProposalRowsPerPage(nextRowsPerPage)
            setProposalPageIndex(1)
          }}
          onViewProposal={goToOpportunity}
        />
      )}
    </Box>
  )
}
