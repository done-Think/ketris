'use client'

import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import { salesPipelineStages } from '../config/sales-pipeline-stages'
import type { SalesPipelineKanbanViewProps } from '../types/sales-pipeline'
import { getOpportunityStageId, getProjectedTotals } from '../utils/sales-pipeline'
import { PipelineStageColumn } from './sales-pipeline-board/PipelineStageColumn'

export function SalesPipelineKanbanView({
  visibleOpportunities,
  fixtureMode,
  fixtureStageByOpportunityId,
  propertiesById,
  presentationByOpportunityId,
  isPipelineLoading,
  hasPipelineError,
}: SalesPipelineKanbanViewProps) {
  const t = useTranslations('crm.pipeline')

  return (
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
              presentationByOpportunityId={presentationByOpportunityId}
            />
          )
        })}
      </Box>
    </Box>
  )
}
