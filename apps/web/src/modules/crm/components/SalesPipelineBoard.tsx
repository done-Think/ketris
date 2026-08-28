'use client'

import { useMemo, useState } from 'react'
import { Alert, Box, Button } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { surface } from '@shared/theme/tokens'

import { salesPipelineStages, visibleSalesPipelineStatuses } from '../config/sales-pipeline-stages'
import { salesPipelineFixtures } from '../fixtures/sales-pipeline-fixtures'
import { useCrmProperties, useOpportunities } from '../hooks/use-opportunities'
import type { SalesPipelineBoardProps, SalesPipelineStageId } from '../types/sales-pipeline'
import {
  getOpportunityStageId,
  getProjectedTotals,
  matchesSalesPipelineSearch,
} from '../utils/sales-pipeline'
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
  const { data: session, status: sessionStatus } = useSession()
  const fixtureMode = preview && process.env.NODE_ENV !== 'production'
  const tenantId = fixtureMode ? '' : (session?.tenantId ?? '')
  const [search, setSearch] = useState('')
  const [selectedStageId, setSelectedStageId] = useState<SalesPipelineStageId | null>(null)
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null)

  const opportunitiesQuery = useOpportunities(tenantId)
  const propertiesQuery = useCrmProperties(tenantId)

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
        propertiesById.get(opportunity.imovelId),
        normalizedSearch,
      )
    })
  }, [fixtureMode, normalizedSearch, opportunitiesQuery.data, propertiesById, selectedStageId])

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
        onSearchChange={setSearch}
        onFilterOpen={setFilterAnchor}
        onFilterClose={() => setFilterAnchor(null)}
        onStageSelect={(stageId) => {
          setSelectedStageId(stageId)
          setFilterAnchor(null)
        }}
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
      ) : (
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
      )}
    </Box>
  )
}
