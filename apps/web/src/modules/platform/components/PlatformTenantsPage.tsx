'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import {
  platformTenantMetrics,
  platformTenants,
  platformTenantTotal,
} from '../data/platform-tenants-fixtures'
import type { PlatformTenantPlan, PlatformTenantStatus } from '../types/platform-tenant'

const pageSize = 6

type PlanFilter = 'all' | PlatformTenantPlan
type StatusFilter = 'all' | PlatformTenantStatus

const planStyles: Record<PlatformTenantPlan, { bgcolor: string; color: string }> = {
  enterprise: { bgcolor: '#FCE3F1', color: brand.magenta[600] },
  pro: { bgcolor: '#E8F0FF', color: brand.semantic.info },
  starter: { bgcolor: brand.neutral[100], color: brand.neutral[500] },
}

const statusStyles: Record<PlatformTenantStatus, { bgcolor: string; color: string }> = {
  active: { bgcolor: '#E7F7EE', color: brand.semantic.success },
  trial: { bgcolor: '#FFF0E6', color: '#D97706' },
  suspended: { bgcolor: '#FDEBEC', color: brand.semantic.error },
}

const metricBadgeStyles: Record<'total' | PlatformTenantPlan, { bgcolor: string; color: string }> =
  {
    total: { bgcolor: brand.graphite[500], color: surface.lightText },
    starter: { bgcolor: brand.neutral[100], color: brand.graphite[500] },
    pro: { bgcolor: '#E8F0FF', color: brand.semantic.info },
    enterprise: { bgcolor: '#FCE3F1', color: brand.magenta[600] },
  }

export function PlatformTenantsPage() {
  const t = useTranslations('platform.tenants')
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState<PlanFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('active')
  const [page, setPage] = useState(1)

  const filteredTenants = useMemo(
    () =>
      platformTenants.filter((tenant) => {
        const matchesQuery = tenant.name
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())
        const matchesPlan = plan === 'all' || tenant.plan === plan
        const matchesStatus = status === 'all' || tenant.status === status

        return matchesQuery && matchesPlan && matchesStatus
      }),
    [plan, query, status],
  )
  const pageCount = Math.max(1, Math.ceil(filteredTenants.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleTenants = filteredTenants.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const initialFixtureView = !query && plan === 'all' && status === 'active'
  const totalLabel = initialFixtureView ? platformTenantTotal : filteredTenants.length
  const start = filteredTenants.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(
    currentPage * pageSize,
    initialFixtureView ? platformTenantTotal : filteredTenants.length,
  )

  const resetPage = () => setPage(1)

  return (
    <Box sx={{ maxWidth: 1680, mx: 'auto', px: { xs: 1.5, sm: 3, lg: 4 }, py: { xs: 2.5, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', xl: 'row' }}
        justifyContent="space-between"
        spacing={2.25}
        sx={{ mb: 3 }}
      >
        <Typography
          component="h1"
          sx={{
            color: brand.graphite[500],
            fontSize: { xs: 28, md: 34 },
            fontWeight: 900,
            letterSpacing: -0.55,
            lineHeight: 1.1,
          }}
        >
          {t('title')}
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          sx={{ width: { xs: '100%', xl: 'auto' } }}
        >
          <TextField
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              resetPage()
            }}
            placeholder={t('searchPlaceholder')}
            hiddenLabel
            inputProps={{ 'aria-label': t('searchLabel') }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: brand.neutral[500], fontSize: 19 }} />
                </InputAdornment>
              ),
            }}
            sx={searchSx}
          />
          <Select
            value={plan}
            onChange={(event) => {
              setPlan(event.target.value as PlanFilter)
              resetPage()
            }}
            inputProps={{ 'aria-label': t('planFilterLabel') }}
            renderValue={(value) =>
              t('planFilterValue', { value: t(`plans.${value as PlanFilter}`) })
            }
            sx={filterSx}
          >
            {(['all', 'starter', 'pro', 'enterprise'] as const).map((item) => (
              <MenuItem key={item} value={item}>
                {t(`plans.${item}`)}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter)
              resetPage()
            }}
            inputProps={{ 'aria-label': t('statusFilterLabel') }}
            renderValue={(value) =>
              t('statusFilterValue', { value: t(`statuses.${value as StatusFilter}`) })
            }
            sx={filterSx}
          >
            {(['all', 'active', 'trial', 'suspended'] as const).map((item) => (
              <MenuItem key={item} value={item}>
                {t(`statuses.${item}`)}
              </MenuItem>
            ))}
          </Select>
          <Button variant="contained" startIcon={<AddRoundedIcon />} sx={newTenantButtonSx}>
            {t('newTenant')}
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 1.75,
          mb: 3,
        }}
      >
        {platformTenantMetrics.map((metric) => (
          <Box key={metric.id} sx={metricCardSx}>
            <Typography sx={{ color: brand.neutral[500], fontSize: 13, fontWeight: 800 }}>
              {t(`metrics.${metric.id}`)}
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 1.1 }}
            >
              <Typography sx={{ color: brand.graphite[500], fontSize: 28, fontWeight: 900 }}>
                {metric.value}
              </Typography>
              <Box component="span" sx={{ ...activeBadgeSx, ...metricBadgeStyles[metric.id] }}>
                {t('activeBadge')}
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>

      <Box component="section" aria-labelledby="tenants-table-title" sx={tablePanelSx}>
        <Typography
          id="tenants-table-title"
          sx={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
          }}
        >
          {t('tableLabel')}
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1120 }} aria-label={t('tableLabel')}>
            <TableHead>
              <TableRow>
                {(
                  [
                    'name',
                    'plan',
                    'brokers',
                    'properties',
                    'mrr',
                    'status',
                    'createdAt',
                    'actions',
                  ] as const
                ).map((column) => (
                  <TableCell key={column} sx={headerCellSx}>
                    {t(`columns.${column}`)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleTenants.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell sx={{ ...bodyCellSx, color: brand.graphite[500], fontWeight: 800 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box
                        aria-hidden
                        sx={{
                          width: 7,
                          height: 7,
                          borderRadius: radius.full,
                          bgcolor:
                            tenant.plan === 'enterprise'
                              ? brand.magenta[500]
                              : tenant.plan === 'pro'
                                ? brand.semantic.info
                                : brand.neutral[400],
                        }}
                      />
                      <span>{tenant.name}</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Box component="span" sx={{ ...chipSx, ...planStyles[tenant.plan] }}>
                      {t(`plans.${tenant.plan}`)}
                    </Box>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{tenant.brokers}</TableCell>
                  <TableCell sx={bodyCellSx}>{tenant.properties}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, color: brand.graphite[500], fontWeight: 800 }}>
                    {tenant.mrr}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Box component="span" sx={{ ...chipSx, ...statusStyles[tenant.status] }}>
                      {t(`statuses.${tenant.status}`)}
                    </Box>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{tenant.createdAt}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Stack direction="row" spacing={0.25}>
                      <IconButton aria-label={t('editAction', { name: tenant.name })} size="small">
                        <EditOutlinedIcon sx={{ fontSize: 19 }} />
                      </IconButton>
                      <IconButton aria-label={t('moreActions', { name: tenant.name })} size="small">
                        <MoreHorizRoundedIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {visibleTenants.length === 0 && (
          <Box sx={{ py: 7, textAlign: 'center' }}>
            <Typography sx={{ color: brand.neutral[500], fontSize: 15 }}>{t('empty')}</Typography>
          </Box>
        )}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ px: { xs: 0.5, md: 1.5 }, pt: 2.25 }}
        >
          <Typography sx={{ color: brand.neutral[500], fontSize: 12 }}>
            {t('summary', { start, end, total: totalLabel })}
          </Typography>
          <Stack direction="row" spacing={0.65}>
            <Button
              size="small"
              variant="outlined"
              disabled={currentPage === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              sx={paginationButtonSx}
            >
              {t('previous')}
            </Button>
            {Array.from({ length: Math.min(3, pageCount) }, (_, index) => index + 1).map((item) => (
              <Button
                key={item}
                size="small"
                variant={item === currentPage ? 'contained' : 'outlined'}
                onClick={() => setPage(item)}
                sx={pageButtonSx}
              >
                {item}
              </Button>
            ))}
            <Button
              size="small"
              variant="outlined"
              disabled={currentPage === pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              sx={paginationButtonSx}
            >
              {t('next')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

const searchSx = {
  minWidth: { sm: 260 },
  flex: { xs: 1, xl: 'initial' },
  '& .MuiOutlinedInput-root': {
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    fontSize: 14,
    height: 44,
  },
}
const filterSx = {
  minWidth: { sm: 145 },
  bgcolor: surface.paper,
  borderRadius: `${radius.sm}px`,
  fontSize: 14,
  fontWeight: 600,
  height: 44,
  '& .MuiSelect-select': {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    fontSize: 14,
    fontWeight: 600,
    height: '100%',
    lineHeight: 1.4,
    padding: '0 36px 0 14px !important',
  },
  '& .MuiSelect-icon': {
    right: 10,
  },
}
const newTenantButtonSx = {
  bgcolor: brand.magenta[500],
  borderRadius: `${radius.sm}px`,
  boxShadow: 'none',
  fontSize: 14,
  fontWeight: 800,
  height: 44,
  px: 2.25,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: brand.magenta[600], boxShadow: 'none' },
}
const metricCardSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.md}px`,
  boxShadow: shadows.crmCardCompact,
  minHeight: 106,
  px: 2,
  py: 1.75,
}
const activeBadgeSx = {
  bgcolor: brand.neutral[100],
  borderRadius: `${radius.sm}px`,
  color: brand.graphite[500],
  fontSize: 12,
  fontWeight: 800,
  px: 1.1,
  py: 0.55,
}
const tablePanelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: alpha.graphite[8],
  borderRadius: `${radius.md}px`,
  boxShadow: shadows.crmCard,
  overflow: 'hidden',
  p: { xs: 1.5, md: 2.25 },
  position: 'relative',
}
const headerCellSx = {
  bgcolor: brand.neutral[50],
  borderBottom: 0,
  color: brand.graphite[500],
  fontSize: 12,
  fontWeight: 800,
  py: 1.35,
  whiteSpace: 'nowrap',
}
const bodyCellSx = {
  borderColor: alpha.graphite[6],
  color: brand.neutral[500],
  fontSize: 13.5,
  fontWeight: 600,
  py: 1.2,
  whiteSpace: 'nowrap',
}
const chipSx = {
  borderRadius: `${radius.sm}px`,
  display: 'inline-flex',
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1,
  px: 1.05,
  py: 0.6,
}
const paginationButtonSx = {
  borderColor: alpha.graphite[8],
  color: brand.neutral[500],
  fontSize: 12,
  minWidth: 0,
  px: 1.15,
  textTransform: 'none',
}
const pageButtonSx = {
  borderColor: alpha.graphite[8],
  boxShadow: 'none',
  fontSize: 12,
  minWidth: 30,
  px: 0.8,
  ...{
    '&.MuiButton-contained': {
      bgcolor: brand.magenta[500],
      '&:hover': { bgcolor: brand.magenta[600], boxShadow: 'none' },
    },
  },
}
