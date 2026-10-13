'use client'

import { Box, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { DashboardTablePagination } from '@shared/components/layout'
import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import type { SalesPipelineListViewProps } from '../types/sales-pipeline'
import { ProposalKpiCards } from './proposals-list/ProposalKpiCards'
import { ProposalMobileCards } from './proposals-list/ProposalMobileCards'
import { ProposalStatusFilters } from './proposals-list/ProposalStatusFilters'
import { ProposalsTable } from './proposals-list/ProposalsTable'

export function SalesPipelineListView({
  proposalStatus,
  proposalSummary,
  onStatusChange,
  proposalPageResult,
  proposalRowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onViewProposal,
}: SalesPipelineListViewProps) {
  const t = useTranslations('crm.pipeline')

  return (
    <Box sx={{ mt: 2 }}>
      <ProposalStatusFilters
        activeStatus={proposalStatus}
        summary={proposalSummary}
        onStatusChange={onStatusChange}
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
          borderColor: alpha.graphite[6],
          borderRadius: `${radius.sm}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.propertyCard,
        }}
      >
        {proposalPageResult.items.length > 0 ? (
          <>
            <ProposalsTable proposals={proposalPageResult.items} onViewProposal={onViewProposal} />
            <ProposalMobileCards
              proposals={proposalPageResult.items}
              onViewProposal={onViewProposal}
            />
          </>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 15.5 }}>
              {t('noResults')}
            </Typography>
          </Stack>
        )}

        <DashboardTablePagination
          count={proposalPageResult.totalCount}
          page={proposalPageResult.page}
          rowsPerPage={proposalRowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      </Paper>
    </Box>
  )
}
