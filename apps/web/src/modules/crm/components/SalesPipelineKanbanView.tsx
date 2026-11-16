'use client'

import * as crmStyles from '../styles/sales-pipeline-kanban-view.styles'

import { CrmPipelineColumn } from './sales-pipeline-board/CrmPipelineColumn'

import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import { salesPipelineStages } from '../config/sales-pipeline-stages'
import type { SalesPipelineKanbanViewProps } from '../types/sales-pipeline'

export function SalesPipelineKanbanView({ search, selectedStageId }: SalesPipelineKanbanViewProps) {
  const t = useTranslations('crm.pipeline')
  const isFocused = selectedStageId !== null
  const visibleStages = selectedStageId
    ? salesPipelineStages.filter((stage) => stage.id === selectedStageId)
    : salesPipelineStages
  return (
    <Box aria-label={t('boardAriaLabel')} sx={crmStyles.boxSx}>
      <Box sx={[crmStyles.boxSx2, isFocused && crmStyles.focusedBoardSx]}>
        {visibleStages.map((stage) => (
          <CrmPipelineColumn
            key={stage.id}
            stage={stage}
            search={search}
            visible
            isFocused={isFocused}
          />
        ))}
      </Box>
    </Box>
  )
}
