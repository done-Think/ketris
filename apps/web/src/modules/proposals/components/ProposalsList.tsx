'use client'

import { useMemo, useState } from 'react'
import { Paper, Stack, Typography } from '@mui/material'

import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import {
  proposalManagementFixtures,
  proposalManagementSummary,
} from '../fixtures/proposal-management-fixtures'
import type { ProposalManagementFilterId, ProposalsListProps } from '../types/proposal-management'
import {
  proposalManagementDefaultPageSize,
  queryProposalManagementItems,
} from '../utils/proposal-management'
import { ProposalKpiCards } from './proposals-list/ProposalKpiCards'
import { ProposalMobileCards } from './proposals-list/ProposalMobileCards'
import { ProposalPagination } from './proposals-list/ProposalPagination'
import { ProposalsHeader } from './proposals-list/ProposalsHeader'
import { ProposalStatusFilters } from './proposals-list/ProposalStatusFilters'
import { ProposalsTable } from './proposals-list/ProposalsTable'

export function ProposalsList({
  proposals = proposalManagementFixtures,
  summary = proposalManagementSummary,
  initialPage = 1,
  pageSize = proposalManagementDefaultPageSize,
  onNewProposal,
  onViewProposal,
  onOpenMoreOptions,
  onPageChange,
}: ProposalsListProps = {}) {
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState<ProposalManagementFilterId>('all')
  const [page, setPage] = useState(initialPage)

  const proposalPage = useMemo(
    () =>
      queryProposalManagementItems(proposals, {
        search,
        status: activeStatus,
        page,
        pageSize,
      }),
    [activeStatus, page, pageSize, proposals, search],
  )

  const changePage = (nextPage: number) => {
    setPage(nextPage)
    onPageChange?.(nextPage)
  }

  return (
    <Stack
      sx={{
        minHeight: '100vh',
        px: { xs: 2, sm: 3, lg: 3.5 },
        pt: { xs: 2, sm: 3, lg: 3.5 },
        pb: { xs: 2, sm: 2.5, lg: 3 },
        bgcolor: surface.app,
      }}
    >
      <ProposalsHeader
        search={search}
        onSearchChange={(nextSearch) => {
          setSearch(nextSearch)
          setPage(1)
        }}
        onNewProposal={onNewProposal}
      />

      <ProposalStatusFilters
        activeStatus={activeStatus}
        summary={summary}
        onStatusChange={(nextStatus) => {
          setActiveStatus(nextStatus)
          setPage(1)
        }}
      />

      <ProposalKpiCards summary={summary} />

      <Paper
        variant="outlined"
        sx={{
          display: 'flex',
          minHeight: { xs: 520, md: 408 },
          mt: 2,
          overflow: 'hidden',
          flex: 1,
          flexDirection: 'column',
          borderColor: brand.neutral[100],
          borderRadius: `${radius.md}px`,
          bgcolor: surface.paper,
          boxShadow: shadows.crmListPanel,
        }}
      >
        {proposalPage.items.length > 0 ? (
          <>
            <ProposalsTable
              proposals={proposalPage.items}
              onViewProposal={onViewProposal}
              onOpenMoreOptions={onOpenMoreOptions}
            />
            <ProposalMobileCards
              proposals={proposalPage.items}
              onViewProposal={onViewProposal}
              onOpenMoreOptions={onOpenMoreOptions}
            />
          </>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              Nenhuma proposta encontrada.
            </Typography>
          </Stack>
        )}

        <ProposalPagination
          page={proposalPage.page}
          pageCount={proposalPage.pageCount}
          visibleCount={proposalPage.items.length}
          totalCount={proposalPage.totalCount}
          onPageChange={changePage}
        />
      </Paper>
    </Stack>
  )
}
