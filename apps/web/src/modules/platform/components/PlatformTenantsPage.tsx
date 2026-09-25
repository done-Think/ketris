'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef } from '@mui/x-data-grid'
import { useMemo, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { platformTenantMetrics, platformTenants } from '../data/platform-tenants-fixtures'
import type {
  PlatformTenant,
  PlatformTenantPlan,
  PlatformTenantStatus,
} from '../types/platform-tenant'
import { platformTenantGridSx } from './platform-tenant-table.styles'
import { PlatformTenantEditDialog } from './PlatformTenantEditDialog'
import { usePlatformGridLocale } from '../hooks/use-platform-grid-locale'

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
  const format = useFormatter()
  const gridLocale = usePlatformGridLocale()
  const [tenants, setTenants] = useState(platformTenants)
  const [editingTenant, setEditingTenant] = useState<PlatformTenant | null>(null)
  const [actionMenu, setActionMenu] = useState<{
    anchor: HTMLElement
    tenant: PlatformTenant
  } | null>(null)
  const [query, setQuery] = useState('')
  const [plan, setPlan] = useState<PlanFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  const filteredTenants = useMemo(
    () =>
      tenants.filter((tenant) => {
        const matchesQuery = tenant.name
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())
        const matchesPlan = plan === 'all' || tenant.plan === plan
        const matchesStatus = status === 'all' || tenant.status === status

        return matchesQuery && matchesPlan && matchesStatus
      }),
    [tenants, plan, query, status],
  )
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filteredTenants.length / pageSize)))
  const tenantGridHeight = 108 + Math.max(1, Math.min(pageSize, filteredTenants.length)) * 52

  const resetPage = () => setPage(1)
  const columns: GridColDef<PlatformTenant>[] = [
    {
      field: 'name',
      headerName: t('columns.name'),
      align: 'left',
      headerAlign: 'left',
      flex: 1.7,
      minWidth: 270,
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ height: '100%', minWidth: 0, width: '100%' }}
        >
          <Box
            aria-hidden
            sx={{
              width: 7,
              height: 7,
              borderRadius: radius.full,
              flexShrink: 0,
              bgcolor:
                row.plan === 'enterprise'
                  ? brand.magenta[500]
                  : row.plan === 'pro'
                    ? brand.semantic.info
                    : brand.neutral[400],
            }}
          />
          <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 13.5, fontWeight: 800 }}>
            {row.name}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'plan',
      headerName: t('columns.plan'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.8,
      minWidth: 125,
      renderCell: ({ row }) => (
        <Chip
          label={t(`plans.${row.plan}`)}
          size="small"
          sx={{ ...chipSx, ...planStyles[row.plan] }}
        />
      ),
    },
    {
      field: 'brokers',
      headerName: t('columns.brokers'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.65,
      minWidth: 105,
    },
    {
      field: 'properties',
      headerName: t('columns.properties'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.65,
      minWidth: 105,
    },
    {
      field: 'mrr',
      type: 'number',
      headerName: t('columns.mrr'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ row }) => (
        <Typography
          sx={{
            color: brand.graphite[500],
            fontSize: 13.5,
            fontWeight: 800,
            alignItems: 'center',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          {format.number(row.mrr, {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
          })}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: t('columns.status'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.8,
      minWidth: 125,
      renderCell: ({ row }) => (
        <Chip
          label={t(`statuses.${row.status}`)}
          size="small"
          sx={{ ...chipSx, ...statusStyles[row.status] }}
        />
      ),
    },
    {
      field: 'createdAt',
      type: 'date',
      valueGetter: (_, row) => {
        const [day, month, year] = row.createdAt.split('/').map(Number)
        return new Date(Date.UTC(year, month - 1, day))
      },
      valueFormatter: (value: Date) =>
        format.dateTime(value, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          timeZone: 'UTC',
        }),
      headerName: t('columns.createdAt'),
      align: 'center',
      headerAlign: 'center',
      flex: 0.9,
      minWidth: 130,
    },
    {
      field: 'actions',
      headerName: t('columns.actions'),
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      width: 108,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          spacing={0.25}
          sx={{ alignItems: 'center', height: '100%', justifyContent: 'center', width: '100%' }}
        >
          <Button
            aria-label={t('editAction', { name: row.name })}
            onClick={(event) => {
              event.stopPropagation()
              setEditingTenant(row)
            }}
            sx={gridActionButtonSx}
          >
            <EditOutlinedIcon sx={{ fontSize: 19 }} />
          </Button>
          <Button
            id={`tenant-actions-${row.id}`}
            aria-label={t('moreActions', { name: row.name })}
            aria-haspopup="menu"
            aria-expanded={actionMenu?.tenant.id === row.id ? true : undefined}
            aria-controls={actionMenu?.tenant.id === row.id ? 'tenant-actions-menu' : undefined}
            onClick={(event) => {
              event.stopPropagation()
              setActionMenu({ anchor: event.currentTarget, tenant: row })
            }}
            sx={gridActionButtonSx}
          >
            <MoreHorizRoundedIcon sx={{ fontSize: 20 }} />
          </Button>
        </Stack>
      ),
    },
  ]

  return (
    <Box sx={{ maxWidth: 1680, mx: 'auto', px: { xs: 2, md: 3, lg: 4 }, py: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', xl: 'row' }}
        justifyContent="space-between"
        spacing={{ xs: 2, md: 2.25 }}
        sx={{
          mb: 3,
          pb: { xs: 2, md: 0 },
          borderBottom: { xs: '1px solid', md: 0 },
          borderColor: alpha.graphite[8],
        }}
      >
        <Typography
          component="h1"
          sx={{
            color: brand.graphite[500],
            fontFamily: { xs: 'var(--font-space-grotesk), system-ui, sans-serif', md: 'inherit' },
            fontSize: { xs: 26, md: 34 },
            fontWeight: { xs: 700, md: 900 },
            letterSpacing: -0.55,
            lineHeight: { xs: 1.15, md: 1.1 },
          }}
        >
          {t('title')}
        </Typography>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.25}
          sx={{
            width: { xs: '100%', xl: 'auto' },
            flexWrap: 'wrap',
            rowGap: { xs: 0, md: 1.25 },
          }}
        >
          <TextField
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              resetPage()
            }}
            placeholder={t('searchPlaceholder')}
            hiddenLabel
            slotProps={{
              htmlInput: { 'aria-label': t('searchLabel') },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: brand.neutral[500], fontSize: 19 }} />
                  </InputAdornment>
                ),
              },
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
            xs: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: { xs: 1.5, md: 1.75 },
          mb: 3,
        }}
      >
        {platformTenantMetrics.map((metric) => (
          <Box key={metric.id} sx={metricCardSx}>
            <Typography
              sx={{
                color: brand.neutral[500],
                fontSize: { xs: 12, md: 13 },
                fontWeight: 800,
                textTransform: { xs: 'uppercase', md: 'none' },
              }}
            >
              {t(`metrics.${metric.id}`)}
            </Typography>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
              sx={{ mt: { xs: 0.75, md: 1.1 }, gap: { xs: 0.75, md: 0 } }}
            >
              <Typography
                sx={{
                  color: brand.graphite[500],
                  fontSize: { xs: 26, md: 28 },
                  fontWeight: 900,
                  lineHeight: { xs: 1.15, md: 'inherit' },
                }}
              >
                {metric.id === 'total'
                  ? tenants.length
                  : tenants.filter((tenant) => tenant.plan === metric.id).length}
              </Typography>
              <Box component="span" sx={{ ...activeBadgeSx, ...metricBadgeStyles[metric.id] }}>
                {t('metricBadge')}
              </Box>
            </Stack>
          </Box>
        ))}
      </Box>

      <Box component="section" aria-label={t('tableLabel')} sx={tablePanelSx}>
        <Box sx={{ height: tenantGridHeight }}>
          <DataGrid
            rows={filteredTenants}
            columns={columns}
            rowHeight={52}
            pagination
            pageSizeOptions={[pageSize]}
            paginationModel={{ page: currentPage - 1, pageSize }}
            onPaginationModelChange={(model) => setPage(model.page + 1)}
            onSortModelChange={resetPage}
            disableRowSelectionOnClick
            disableColumnMenu
            localeText={{
              ...gridLocale,
              noRowsLabel: t('empty'),
              MuiTablePagination: {
                ...gridLocale.MuiTablePagination,
                labelRowsPerPage: '',
                labelDisplayedRows: ({ from, to }) =>
                  t('summary', { start: from, end: to, total: filteredTenants.length }),
              },
            }}
            sx={tenantsGridSx}
          />
        </Box>
      </Box>
      <Menu
        id="tenant-actions-menu"
        anchorEl={actionMenu?.anchor}
        open={Boolean(actionMenu)}
        onClose={() => setActionMenu(null)}
        slotProps={{
          list: {
            'aria-labelledby': actionMenu ? `tenant-actions-${actionMenu.tenant.id}` : undefined,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (actionMenu) setEditingTenant(actionMenu.tenant)
            setActionMenu(null)
          }}
        >
          {t('edit')}
        </MenuItem>
      </Menu>
      {editingTenant && (
        <PlatformTenantEditDialog
          key={editingTenant.id}
          tenant={editingTenant}
          onClose={() => setEditingTenant(null)}
          onSave={(updated) => {
            setTenants((current) =>
              current.map((tenant) => (tenant.id === updated.id ? updated : tenant)),
            )
            setEditingTenant(null)
            resetPage()
          }}
        />
      )}
    </Box>
  )
}

const searchSx = {
  width: { xs: '100%', md: 'auto' },
  minWidth: { sm: 260 },
  flex: { xs: 'none', md: 1, xl: 'initial' },
  '& .MuiOutlinedInput-root': {
    bgcolor: surface.paper,
    borderRadius: `${radius.sm}px`,
    fontSize: 14,
    height: 44,
  },
}
const filterSx = {
  width: { xs: '100%', md: 'auto' },
  minWidth: { sm: 145 },
  bgcolor: surface.paper,
  borderRadius: { xs: `${radius.full}px`, md: `${radius.sm}px` },
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
  width: { xs: '100%', md: 'auto' },
  px: 2.25,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: brand.magenta[600], boxShadow: 'none' },
}
const metricCardSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: { xs: alpha.graphite[6], md: alpha.graphite[8] },
  borderRadius: { xs: `${radius.sm}px`, md: `${radius.md}px` },
  boxShadow: { xs: shadows.propertyCard, md: shadows.crmCardCompact },
  minHeight: { xs: 120, md: 106 },
  px: 2,
  py: { xs: 2, md: 1.75 },
}
const activeBadgeSx = {
  bgcolor: brand.neutral[100],
  borderRadius: `${radius.sm}px`,
  color: brand.graphite[500],
  fontSize: 12,
  fontWeight: 800,
  px: { xs: 0.75, md: 1.1 },
  py: { xs: 0.25, md: 0.55 },
}
const tablePanelSx = {
  bgcolor: surface.paper,
  border: '1px solid',
  borderColor: { xs: alpha.graphite[6], md: alpha.graphite[8] },
  borderRadius: { xs: `${radius.sm}px`, md: `${radius.md}px` },
  boxShadow: { xs: shadows.crmCardCompact, md: shadows.crmCard },
  overflow: 'hidden',
  p: { xs: 1, md: 2.75 },
  minWidth: 0,
  width: '100%',
}
const chipSx = {
  borderRadius: `${radius.full}px`,
  fontSize: { xs: 12, md: 10 },
  fontWeight: 800,
  height: { xs: 26, md: 22 },
}
const gridActionButtonSx = {
  color: brand.neutral[500],
  minWidth: { xs: 42, md: 36 },
  width: { xs: 42, md: 36 },
  height: { xs: 42, md: 36 },
  p: 0,
  borderRadius: `${radius.sm}px`,
  '&:hover': { bgcolor: alpha.magenta[6], color: brand.magenta[500] },
}
const tenantsGridSx = {
  ...platformTenantGridSx,
  minWidth: 0,
  '& .MuiDataGrid-footerContainer': { borderColor: alpha.graphite[6] },
  '& .MuiTablePagination-toolbar': { px: { xs: 1, sm: 2 }, flexWrap: 'wrap' },
  '& .MuiTablePagination-displayedRows': {
    color: brand.neutral[500],
    fontSize: 12,
    mr: 'auto',
  },
  '& .MuiTablePagination-actions': { ml: 0 },
  '& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
  '& .MuiDataGrid-virtualScrollerContent': { minWidth: 1120 },
  '& .MuiDataGrid-virtualScrollerRenderZone': { minWidth: 1120 },
  '& .MuiDataGrid-columnHeadersInner': { minWidth: 1120 },
}
