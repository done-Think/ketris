'use client'

import * as crmStyles from '../styles/sales-pipeline-kanban-view.styles'

import { CrmPipelineColumn } from './sales-pipeline-board/CrmPipelineColumn'

import { Box } from '@mui/material'
import { useTranslations } from 'next-intl'

import { salesPipelineStages } from '../config/sales-pipeline-stages'
import type { SalesPipelineKanbanViewProps } from '../types/sales-pipeline'

export function SalesPipelineKanbanView({ search, selectedStageId }: SalesPipelineKanbanViewProps) {
  const t = useTranslations('crm.pipeline')
  return (
    <Box aria-label={t('boardAriaLabel')} sx={crmStyles.boxSx}>
      <Box sx={crmStyles.boxSx2}>
        {salesPipelineStages.map((stage) => (
          <CrmPipelineColumn
            key={stage.id}
            stage={stage}
            search={search}
            visible={!selectedStageId || selectedStageId === stage.id}
          />
        ))}
      </Box>
    </Box>
  )
}
