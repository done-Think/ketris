'use client'

import { useMemo, useState } from 'react'
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'
import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import { salesPipelineStages, visibleSalesPipelineStatuses } from '../config/sales-pipeline-stages'
import { salesPipelineFixtures } from '../fixtures/sales-pipeline-fixtures'
import {
  useCreateOpportunity,
  useCrmProperties,
  useOpportunities,
} from '../hooks/use-opportunities'
import type { CreateOpportunityFormValues } from '../types/opportunity'
import type {
  SalesPipelineBoardProps,
  SalesPipelineStageId,
  SalesPipelineViewMode,
} from '../types/sales-pipeline'
import { errorMessage } from '../utils/error-message'
import {
  getOpportunityStageId,
  getProjectedTotals,
  matchesSalesPipelineSearch,
} from '../utils/sales-pipeline'
import type {
  ProposalManagementFilterId,
  ProposalManagementListItem,
} from '@modules/proposals/types/proposal-management'
import {
  buildProposalManagementSummary,
  mapOpportunityToProposalListItem,
} from '@modules/proposals/utils/opportunity-adapter'
import {
  proposalManagementDefaultPageSize,
  queryProposalManagementItems,
} from '@modules/proposals/utils/proposal-management'
import { ProposalKpiCards } from '@modules/proposals/components/proposals-list/ProposalKpiCards'
import { ProposalMobileCards } from '@modules/proposals/components/proposals-list/ProposalMobileCards'
import { ProposalPagination } from '@modules/proposals/components/proposals-list/ProposalPagination'
import { ProposalStatusFilters } from '@modules/proposals/components/proposals-list/ProposalStatusFilters'
import { ProposalsTable } from '@modules/proposals/components/proposals-list/ProposalsTable'
import { CreateOpportunityDialog } from './opportunity-detail/CreateOpportunityDialog'
import { PipelineStageColumn } from './sales-pipeline-board/PipelineStageColumn'
import { SalesPipelineToolbar } from './sales-pipeline-board/SalesPipelineToolbar'

const pipelineBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'
const fixtureOpportunities = salesPipelineFixtures.map((fixture) => fixture.opportunity)
const fixtureProperties = salesPipelineFixtures.map((fixture) => fixture.property)
const fixtureStageByOpportunityId = new Map(
  salesPipelineFixtures.map((fixture) => [fixture.opportunity.id, fixture.stageId]),
)
const fixturePresentationByOpportunityId = new Map(
  salesPipelineFixtures.map((fixture) => [fixture.opportunity.id, fixture.presentation]),
)

export function SalesPipelineBoard({ preview = false }: SalesPipelineBoardProps) {
  const t = useTranslations('crm.pipeline')
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const fixtureMode = preview && process.env.NODE_ENV !== 'production'
  const tenantId = fixtureMode ? '' : (session?.tenantId ?? '')
  const [search, setSearch] = useState('')
  const [selectedStageId, setSelectedStageId] = useState<SalesPipelineStageId | null>(null)
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [viewMode, setViewMode] = useState<SalesPipelineViewMode>('kanban')
  const [proposalStatus, setProposalStatus] = useState<ProposalManagementFilterId>('all')
  const [proposalPageIndex, setProposalPageIndex] = useState(1)
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
    () =>
      new Map(
        (fixtureMode ? fixtureProperties : (propertiesQuery.data ?? [])).map((property) => [
          property.id,
          property,
        ]),
      ),
    [fixtureMode, propertiesQuery.data],
  )

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const visibleOpportunities = useMemo(() => {
    const opportunities = fixtureMode ? fixtureOpportunities : (opportunitiesQuery.data ?? [])

    return opportunities.filter((opportunity) => {
      if (!fixtureMode && !visibleSalesPipelineStatuses.has(opportunity.status)) return false

      const stageId = getOpportunityStageId(opportunity, fixtureMode, fixtureStageByOpportunityId)
      if (!stageId || (selectedStageId && stageId !== selectedStageId)) return false

      return matchesSalesPipelineSearch(
        opportunity,
        propertiesById.get(opportunity.propertyId),
        normalizedSearch,
      )
    })
  }, [fixtureMode, normalizedSearch, opportunitiesQuery.data, propertiesById, selectedStageId])

  const proposalItems = useMemo<readonly ProposalManagementListItem[]>(() => {
    const opportunities = fixtureMode ? fixtureOpportunities : (opportunitiesQuery.data ?? [])

    return opportunities.map((opportunity) =>
      mapOpportunityToProposalListItem(
        opportunity,
        propertiesById.get(opportunity.propertyId),
        opportunity.propertyId,
      ),
    )
  }, [fixtureMode, opportunitiesQuery.data, propertiesById])

  const proposalSummary = useMemo(
    () => buildProposalManagementSummary(proposalItems),
    [proposalItems],
  )

  const proposalPageResult = useMemo(
    () =>
      queryProposalManagementItems(proposalItems, {
        search,
        status: proposalStatus,
        page: proposalPageIndex,
        pageSize: proposalManagementDefaultPageSize,
      }),
    [proposalItems, proposalPageIndex, proposalStatus, search],
  )

  function goToOpportunity(proposal: ProposalManagementListItem) {
    router.push({ pathname: '/crm/opportunities/[id]', params: { id: proposal.id } })
  }

  const selectedStage = selectedStageId
    ? salesPipelineStages.find((stage) => stage.id === selectedStageId)
    : null
  const isPipelineLoading =
    !fixtureMode && (sessionStatus === 'loading' || opportunitiesQuery.isLoading)
  const hasPipelineError = !fixtureMode && (opportunitiesQuery.isError || propertiesQuery.isError)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: { xs: 2, sm: 3, lg: 3.5 },
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
        onNewOpportunity={() => !fixtureMode && setIsCreateOpen(true)}
        onViewModeChange={setViewMode}
      />

      {!fixtureMode ? (
        <CreateOpportunityDialog
          open={isCreateOpen}
          tenantId={tenantId}
          isPending={createOpportunity.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreateOpportunity}
        />
      ) : null}

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
        <Box
          aria-label={t('boardAriaLabel')}
          sx={{
            mt: { xs: 2.25, lg: 1.5 },
            mx: { xs: -2, sm: -3, lg: -3.5 },
            pl: { xs: 2, sm: 3, lg: 3.5 },
            pr: { xs: 2, sm: 3, lg: 1.75 },
            pb: 1,
            overflowX: 'auto',
            scrollSnapType: { xs: 'x proximity', lg: 'none' },
            scrollbarWidth: 'thin',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(5, 264px)',
                sm: 'repeat(5, 280px)',
                lg: 'repeat(5, minmax(0, 1fr))',
              },
              gap: { xs: 2, lg: 1.75 },
              minWidth: { xs: 'max-content', lg: 0 },
            }}
          >
            {salesPipelineStages.map((stage) => {
              const opportunities = visibleOpportunities.filter(
                (opportunity) =>
                  getOpportunityStageId(opportunity, fixtureMode, fixtureStageByOpportunityId) ===
                  stage.id,
              )
              const projectedTotals = getProjectedTotals(
                opportunities.filter((opportunity) => opportunity.status !== 'RECUSADA'),
                propertiesById,
              )

              return (
                <PipelineStageColumn
                  key={stage.id}
                  stage={stage}
                  opportunities={opportunities}
                  projectedTotals={projectedTotals}
                  isPipelineLoading={isPipelineLoading}
                  hasPipelineError={hasPipelineError}
                  fixtureMode={fixtureMode}
                  propertiesById={propertiesById}
                  presentationByOpportunityId={fixturePresentationByOpportunityId}
                />
              )
            })}
          </Box>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <ProposalStatusFilters
            activeStatus={proposalStatus}
            summary={proposalSummary}
            onStatusChange={(nextStatus) => {
              setProposalStatus(nextStatus)
              setProposalPageIndex(1)
            }}
          />

          <ProposalKpiCards summary={proposalSummary} />

          <Paper
            variant="outlined"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: { xs: 520, md: 408 },
              mt: 2,
              overflow: 'hidden',
              borderColor: brand.neutral[100],
              borderRadius: `${radius.md}px`,
              bgcolor: surface.paper,
              boxShadow: shadows.crmListPanel,
            }}
          >
            {proposalPageResult.items.length > 0 ? (
              <>
                <ProposalsTable
                  proposals={proposalPageResult.items}
                  onViewProposal={goToOpportunity}
                />
                <ProposalMobileCards
                  proposals={proposalPageResult.items}
                  onViewProposal={goToOpportunity}
                />
              </>
            ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {t('noResults')}
                </Typography>
              </Stack>
            )}

            <ProposalPagination
              page={proposalPageResult.page}
              pageCount={proposalPageResult.pageCount}
              visibleCount={proposalPageResult.items.length}
              totalCount={proposalPageResult.totalCount}
              onPageChange={setProposalPageIndex}
            />
          </Paper>
        </Box>
      )}
    </Box>
  )
}
