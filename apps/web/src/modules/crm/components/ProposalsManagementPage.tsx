'use client'

import { useMemo, useState } from 'react'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'
import {
  DashboardNotificationsButton,
  DashboardPageHeader,
  DashboardTablePagination,
} from '@shared/components/layout'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { useCrmProperties, useOpportunities } from '../hooks/use-opportunities'
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
import { ProposalKpiCards } from './proposals-list/ProposalKpiCards'
import { ProposalMobileCards } from './proposals-list/ProposalMobileCards'
import { ProposalStatusFilters } from './proposals-list/ProposalStatusFilters'
import { ProposalsTable } from './proposals-list/ProposalsTable'

const proposalsBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'

export function ProposalsManagementPage() {
  const t = useTranslations('dashboard.proposals')
  const tPipeline = useTranslations('crm.pipeline')
  const router = useRouter()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProposalManagementFilterId>('all')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(proposalManagementDefaultPageSize)

  const opportunitiesQuery = useOpportunities(tenantId)
  const propertiesQuery = useCrmProperties(tenantId)
  const isLoading = opportunitiesQuery.isLoading || propertiesQuery.isLoading
  const hasError = opportunitiesQuery.isError || propertiesQuery.isError

  const propertiesById = useMemo(
    () => new Map((propertiesQuery.data ?? []).map((property) => [property.id, property])),
    [propertiesQuery.data],
  )

  const proposalItems = useMemo<readonly ProposalManagementListItem[]>(
    () =>
      (opportunitiesQuery.data ?? []).map((opportunity) =>
        mapOpportunityToProposalListItem(
          opportunity,
          propertiesById.get(opportunity.propertyId),
          opportunity.propertyId,
        ),
      ),
    [opportunitiesQuery.data, propertiesById],
  )

  const summary = useMemo(() => buildProposalManagementSummary(proposalItems), [proposalItems])

  const pageResult = useMemo(
    () =>
      queryProposalManagementItems(proposalItems, { search, status, page, pageSize: rowsPerPage }),
    [proposalItems, page, rowsPerPage, search, status],
  )

  function goToOpportunity(proposal: ProposalManagementListItem) {
    router.push({ pathname: '/crm/opportunities/[id]', params: { id: proposal.id } })
  }

  return (
    <Box
      sx={{
        width: '100%',
        p: 3.5,
        fontFamily: proposalsBodyFontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root': {
          fontFamily: proposalsBodyFontFamily,
        },
        '& h1.MuiTypography-root': {
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
        },
      }}
    >
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.2}
              sx={{
                width: { xs: '100%', md: 'auto' },
                alignItems: { xs: 'stretch', sm: 'center' },
              }}
            >
              <TextField
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder={tPipeline('searchPlaceholder')}
                size="small"
                sx={{
                  width: { xs: '100%', sm: 268 },
                  '& .MuiInputBase-root': {
                    height: { xs: 40, sm: 32 },
                    borderRadius: `${radius.sm}px`,
                    bgcolor: surface.paper,
                    color: brand.graphite[500],
                    fontSize: 12,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha.graphite[8],
                  },
                }}
                slotProps={{
                  htmlInput: { 'aria-label': tPipeline('searchAriaLabel') },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon
                          sx={{ color: brand.neutral[400], fontSize: iconSize.sm }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <DashboardNotificationsButton />
              </Box>
            </Stack>
          }
        />

        {hasError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  if (opportunitiesQuery.isError) void opportunitiesQuery.refetch()
                  if (propertiesQuery.isError) void propertiesQuery.refetch()
                }}
              >
                {tPipeline('retry')}
              </Button>
            }
          >
            {tPipeline('dataLoadError')}
          </Alert>
        ) : (
          <>
            <ProposalStatusFilters
              activeStatus={status}
              summary={summary}
              onStatusChange={(nextStatus) => {
                setStatus(nextStatus)
                setPage(1)
              }}
            />

            <ProposalKpiCards summary={summary} />

            <Paper
              variant="outlined"
              sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: { xs: 520, md: 408 },
                overflow: 'hidden',
                borderColor: alpha.graphite[6],
                borderRadius: `${radius.sm}px`,
                bgcolor: surface.paper,
                boxShadow: shadows.propertyCard,
              }}
            >
              {isLoading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
                  <CircularProgress size={28} />
                </Stack>
              ) : pageResult.items.length > 0 ? (
                <>
                  <ProposalsTable proposals={pageResult.items} onViewProposal={goToOpportunity} />
                  <ProposalMobileCards
                    proposals={pageResult.items}
                    onViewProposal={goToOpportunity}
                  />
                </>
              ) : (
                <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: 15.5 }}>
                    {tPipeline('noResults')}
                  </Typography>
                </Stack>
              )}

              <DashboardTablePagination
                count={pageResult.totalCount}
                page={pageResult.page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={(nextRowsPerPage) => {
                  setRowsPerPage(nextRowsPerPage)
                  setPage(1)
                }}
              />
            </Paper>
          </>
        )}
      </Stack>
    </Box>
  )
}
