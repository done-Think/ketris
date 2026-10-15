'use client'

import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useMemo, useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { useTenants } from '../hooks/use-tenants'
import type { MonthlyCharge } from '../types/platform-plan'
import {
  TENANT_ACCOUNT_TYPES,
  TENANT_STATUSES,
  type PlatformTenant,
  type TenantAccountType,
  type TenantStatus,
} from '../types/tenant'
import { accountInitials } from '../utils/account-type-icons'
import { tenantStatusChipColor } from '../utils/tenant-status'
import { EditTenantAccountDialog } from './EditTenantAccountDialog'

type StatusFilter = 'ALL' | TenantStatus
type TypeFilter = 'ALL' | TenantAccountType

interface TenantsListProps {
  // Search, account type filter and status tabs (the tenants page); the overview shows the list only.
  withFilters?: boolean
}

export function TenantsList({ withFilters = false }: TenantsListProps) {
  const t = useTranslations('platform.dashboard')
  const tenantsT = useTranslations('platform.tenants')
  const formsT = useTranslations('platform.forms')
  const accountT = useTranslations('platform.account')
  const plansT = useTranslations('platform.plans')
  const format = useFormatter()
  const [editingTenant, setEditingTenant] = useState<PlatformTenant | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [accountType, setAccountType] = useState<TypeFilter>('ALL')
  const { data: tenants, isPending, isError } = useTenants()
  // On phones the six columns do not fit: each account becomes a stacked row instead.
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const formatPrice = (value: number) =>
    format.number(value, { style: 'currency', currency: 'BRL' })
  const describeCharge = (charge: MonthlyCharge) =>
    charge.extraUnits > 0
      ? plansT(
          charge.usageUnit === 'BROKERS' ? 'chargeWithExtraBrokers' : 'chargeWithExtraProperties',
          {
            base: formatPrice(charge.basePrice),
            count: charge.extraUnits,
            extra: formatPrice(charge.extraAmount),
          },
        )
      : plansT('chargeBaseOnly')

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: tenants?.length ?? 0,
      TRIAL: 0,
      ACTIVE: 0,
      SUSPENDED: 0,
      CANCELED: 0,
    }
    for (const tenant of tenants ?? []) counts[tenant.status] += 1
    return counts
  }, [tenants])

  const visibleTenants = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return (tenants ?? []).filter(
      (tenant) =>
        (status === 'ALL' || tenant.status === status) &&
        (accountType === 'ALL' || tenant.accountType === accountType) &&
        (!search ||
          tenant.name.toLocaleLowerCase().includes(search) ||
          tenant.slug.includes(search)),
    )
  }, [tenants, query, status, accountType])

  const clearFilters = () => {
    setQuery('')
    setStatus('ALL')
    setAccountType('ALL')
  }

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: surface.paper,
        borderColor: alpha.graphite[6],
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.propertyCard,
      }}
    >
      {withFilters && tenants && tenants.length > 0 ? (
        <Box sx={{ borderBottom: '1px solid', borderColor: alpha.graphite[6] }}>
          <Tabs
            value={status}
            onChange={(_, value: StatusFilter) => setStatus(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label={tenantsT('filters.statusLabel')}
            sx={{ px: { xs: 1, md: 1.6 }, minHeight: 48 }}
          >
            {(['ALL', ...TENANT_STATUSES] as const).map((item) => (
              <Tab
                key={item}
                value={item}
                sx={{ textTransform: 'none', fontWeight: 700, minHeight: 48 }}
                label={
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <span>
                      {item === 'ALL'
                        ? tenantsT('filters.allStatuses')
                        : accountT(`statuses.${item}`)}
                    </span>
                    <Chip
                      size="small"
                      label={statusCounts[item]}
                      sx={{ height: 20, fontWeight: 800 }}
                    />
                  </Stack>
                }
              />
            ))}
          </Tabs>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.2}
            sx={{
              px: { xs: 1.6, md: 2.2 },
              py: 1.6,
              borderTop: '1px solid',
              borderColor: alpha.graphite[6],
            }}
          >
            <TextField
              size="small"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tenantsT('search.placeholder')}
              slotProps={{
                htmlInput: { 'aria-label': tenantsT('search.label') },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon
                        sx={{ fontSize: iconSize.lg, color: brand.neutral[500] }}
                      />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ flex: 1, maxWidth: { sm: 420 } }}
            />
            <TextField
              select
              size="small"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value as TypeFilter)}
              label={tenantsT('filters.typeLabel')}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="ALL">{tenantsT('filters.allTypes')}</MenuItem>
              {TENANT_ACCOUNT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {accountT(`accountTypes.${type}`)}
                </MenuItem>
              ))}
            </TextField>
            <Typography
              sx={{
                color: brand.neutral[500],
                fontSize: 13,
                alignSelf: { sm: 'center' },
                ml: { sm: 'auto !important' },
              }}
            >
              {tenantsT('count', { count: visibleTenants.length })}
            </Typography>
          </Stack>
        </Box>
      ) : null}

      {isPending ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('loadError')}</Typography>
        </Stack>
      ) : tenants && tenants.length > 0 && visibleTenants.length === 0 ? (
        <Stack alignItems="center" spacing={1} sx={{ py: 6, px: 3, textAlign: 'center' }}>
          <Typography sx={{ color: brand.graphite[500], fontSize: 15, fontWeight: 800 }}>
            {tenantsT('noResults')}
          </Typography>
          <Button size="small" variant="outlined" color="secondary" onClick={clearFilters}>
            {tenantsT('clearFilters')}
          </Button>
        </Stack>
      ) : tenants && tenants.length > 0 && isMobile ? (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {visibleTenants.map((tenant) => (
            <Stack
              component="li"
              key={tenant.id}
              direction="row"
              spacing={1.3}
              sx={{
                px: 2,
                py: 1.6,
                borderBottom: '1px solid',
                borderColor: alpha.graphite[6],
                '&:last-of-type': { borderBottom: 0 },
              }}
            >
              <Avatar aria-hidden sx={avatarSx}>
                {accountInitials(tenant.name)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box
                  component={Link}
                  href={{ pathname: '/platform/tenants/[id]', params: { id: tenant.id } }}
                  sx={nameLinkSx}
                >
                  {tenant.name}
                </Box>
                <Typography sx={{ ...slugSx, overflowWrap: 'anywhere' }}>{tenant.slug}</Typography>
                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={accountT(`accountTypes.${tenant.accountType}`)}
                  />
                  <Chip
                    size="small"
                    color={tenantStatusChipColor[tenant.status]}
                    variant={tenant.status === 'CANCELED' ? 'outlined' : 'filled'}
                    label={accountT(`statuses.${tenant.status}`)}
                  />
                </Stack>
                {tenant.monthlyCharge ? (
                  <Typography
                    sx={{ color: brand.graphite[500], fontSize: 13.5, fontWeight: 800, mt: 0.8 }}
                  >
                    {formatPrice(tenant.monthlyCharge.total)}
                    <Box component="span" sx={{ color: brand.neutral[500], fontWeight: 500 }}>
                      {' · '}
                      {describeCharge(tenant.monthlyCharge)}
                    </Box>
                  </Typography>
                ) : null}
              </Box>
              <IconButton
                size="small"
                aria-label={accountT('editAction', { name: tenant.name })}
                onClick={() => setEditingTenant(tenant)}
                sx={{ color: brand.neutral[500], alignSelf: 'flex-start' }}
              >
                <EditOutlinedIcon sx={{ fontSize: iconSize.sm }} />
              </IconButton>
            </Stack>
          ))}
        </Box>
      ) : tenants && tenants.length > 0 ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{formsT('name')}</TableCell>
                <TableCell>{accountT('fields.accountType')}</TableCell>
                <TableCell>{accountT('fields.status')}</TableCell>
                <TableCell align="right">{accountT('fields.monthlyCharge')}</TableCell>
                <TableCell>{t('createdAt')}</TableCell>
                <TableCell align="right">
                  <Box component="span" sx={visuallyHiddenSx}>
                    {accountT('actions')}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleTenants.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.3} alignItems="center" sx={{ minWidth: 220 }}>
                      <Avatar aria-hidden sx={avatarSx}>
                        {accountInitials(tenant.name)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Box
                          component={Link}
                          href={{ pathname: '/platform/tenants/[id]', params: { id: tenant.id } }}
                          sx={nameLinkSx}
                        >
                          {tenant.name}
                        </Box>
                        <Typography sx={slugSx}>{tenant.slug}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{accountT(`accountTypes.${tenant.accountType}`)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={tenantStatusChipColor[tenant.status]}
                      variant={tenant.status === 'CANCELED' ? 'outlined' : 'filled'}
                      label={accountT(`statuses.${tenant.status}`)}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    {tenant.monthlyCharge ? (
                      <Tooltip title={describeCharge(tenant.monthlyCharge)}>
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          {formatPrice(tenant.monthlyCharge.total)}
                        </Box>
                      </Tooltip>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {format.dateTime(new Date(tenant.createdAt))}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={accountT('editAction', { name: tenant.name })}>
                      <IconButton
                        size="small"
                        aria-label={accountT('editAction', { name: tenant.name })}
                        onClick={() => setEditingTenant(tenant)}
                        sx={{ color: brand.neutral[500] }}
                      >
                        <EditOutlinedIcon sx={{ fontSize: iconSize.sm }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('empty')}</Typography>
        </Stack>
      )}
      {editingTenant ? (
        <EditTenantAccountDialog tenant={editingTenant} onClose={() => setEditingTenant(null)} />
      ) : null}
    </Card>
  )
}

const avatarSx = {
  width: 34,
  height: 34,
  bgcolor: alpha.magenta[8],
  color: brand.magenta[500],
  fontSize: 12.5,
  fontWeight: 800,
}
const nameLinkSx = {
  color: brand.graphite[500],
  fontWeight: 700,
  textDecoration: 'none',
  '&:hover': { color: brand.magenta[500], textDecoration: 'underline' },
}
const slugSx = { color: brand.neutral[500], fontSize: 12, fontFamily: 'monospace' }

// Accessible name for the actions column without showing a header.
const visuallyHiddenSx = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
} as const
