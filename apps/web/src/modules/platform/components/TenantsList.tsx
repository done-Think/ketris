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
  Select,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useState } from 'react'
import { useFormatter, useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { DashboardTablePagination } from '@shared/components/layout'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useListState } from '@shared/hooks/use-list-state'

import { tenantSearchDebounceMs, tenantsPageSizeOptions } from '../config/platform-lists'
import { usePlatformActor } from '../hooks/use-platform-actor'
import { useTenantsPage } from '../hooks/use-tenants'
import type { MonthlyCharge } from '../types/platform-plan'
import { TENANT_ACCOUNT_TYPES, TENANT_STATUSES, type PlatformTenant } from '../types/tenant'
import { accountInitials } from '../utils/account-type-icons'
import { tenantStatusChipColor, toTenantTypeFilter } from '../utils/tenant-status'
import { EditTenantAccountDialog } from './EditTenantAccountDialog'
import { styles } from '../styles/tenants-list.styles'
import type {
  StatusFilter,
  TenantsFiltersProps,
  TenantsListProps,
  TenantsListState,
} from '../types/tenant'

export function TenantsList({ filters }: TenantsListProps) {
  const t = useTranslations('platform.dashboard')
  const tenantsT = useTranslations('platform.tenants')
  const formsT = useTranslations('platform.forms')
  const accountT = useTranslations('platform.account')
  const plansT = useTranslations('platform.plans')
  const format = useFormatter()
  const [editingTenant, setEditingTenant] = useState<PlatformTenant | null>(null)
  const { canManage } = usePlatformActor()
  const q = useDebouncedValue((filters?.query ?? '').trim(), tenantSearchDebounceMs)
  const accountType = filters?.accountType ?? 'ALL'
  const scope = `${q}|${accountType}`
  const { filters: list, updateFilters } = useListState<TenantsListState>({
    status: 'ALL',
    page: 1,
    pageSize: tenantsPageSizeOptions[0],
    scope,
  })
  const status = list.scope === scope ? list.status : 'ALL'
  const page = list.scope === scope ? list.page : 1
  const { data, isPending, isError } = useTenantsPage({
    q: q || undefined,
    status: status === 'ALL' ? undefined : status,
    accountType: accountType === 'ALL' ? undefined : accountType,
    page,
    pageSize: list.pageSize,
  })
  const tenants = data?.tenants
  const visibleTenants = tenants ?? []
  const filtered = Boolean(q) || accountType !== 'ALL' || status !== 'ALL'
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

  const statusCounts: Record<StatusFilter, number> = {
    ALL: TENANT_STATUSES.reduce((total, item) => total + (data?.statusCounts[item] ?? 0), 0),
    TRIAL: data?.statusCounts.TRIAL ?? 0,
    ACTIVE: data?.statusCounts.ACTIVE ?? 0,
    SUSPENDED: data?.statusCounts.SUSPENDED ?? 0,
    CANCELED: data?.statusCounts.CANCELED ?? 0,
  }

  const clearFilters = () => {
    updateFilters({ status: 'ALL', page: 1, scope })
    filters?.onClear()
  }

  return (
    <Card variant="outlined" sx={styles.card}>
      {filters && data && (statusCounts.ALL > 0 || filtered) ? (
        <Stack direction="row" alignItems="center" sx={styles.stack}>
          <Tabs
            value={status}
            onChange={(_, value: StatusFilter) => updateFilters({ status: value, page: 1, scope })}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label={tenantsT('filters.statusLabel')}
            sx={styles.tabs}
          >
            {(['ALL', ...TENANT_STATUSES] as const).map((item) => (
              <Tab
                key={item}
                value={item}
                sx={styles.tab}
                label={
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <span>
                      {item === 'ALL'
                        ? tenantsT('filters.allStatuses')
                        : accountT(`statuses.${item}`)}
                    </span>
                    <Chip size="small" label={statusCounts[item]} sx={styles.chip} />
                  </Stack>
                }
              />
            ))}
          </Tabs>
          <Typography sx={styles.typography}>
            {tenantsT('count', { count: data.totalCount })}
          </Typography>
        </Stack>
      ) : null}

      {isPending ? (
        <Stack alignItems="center" sx={styles.stack2}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Stack sx={styles.stack2} alignItems="center">
          <Typography color="text.secondary">{t('loadError')}</Typography>
        </Stack>
      ) : visibleTenants.length === 0 && filtered ? (
        <Stack alignItems="center" spacing={1} sx={styles.stack3}>
          <Typography sx={styles.typography2}>{tenantsT('noResults')}</Typography>
          <Button size="small" variant="outlined" color="secondary" onClick={clearFilters}>
            {tenantsT('clearFilters')}
          </Button>
        </Stack>
      ) : visibleTenants.length > 0 && isMobile ? (
        <Box component="ul" sx={styles.box}>
          {visibleTenants.map((tenant) => (
            <Stack component="li" key={tenant.id} direction="row" spacing={1.3} sx={styles.stack4}>
              <Avatar aria-hidden sx={styles.avatar}>
                {accountInitials(tenant.name)}
              </Avatar>
              <Box sx={styles.box2}>
                <Box
                  component={Link}
                  href={{ pathname: '/platform/tenants/[id]', params: { id: tenant.id } }}
                  sx={styles.nameLink}
                >
                  {tenant.name}
                </Box>
                <Typography sx={styles.typography3}>{tenant.slug}</Typography>
                <Stack direction="row" spacing={0.8} alignItems="center" sx={styles.stack5}>
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
                  <Typography sx={styles.typography4}>
                    {formatPrice(tenant.monthlyCharge.total)}
                    <Box component="span" sx={styles.box3}>
                      {' · '}
                      {describeCharge(tenant.monthlyCharge)}
                    </Box>
                  </Typography>
                ) : null}
              </Box>
              {canManage ? (
                <IconButton
                  size="small"
                  aria-label={accountT('editAction', { name: tenant.name })}
                  onClick={() => setEditingTenant(tenant)}
                  sx={styles.iconButton}
                >
                  <EditOutlinedIcon sx={styles.editOutlinedIcon} />
                </IconButton>
              ) : null}
            </Stack>
          ))}
        </Box>
      ) : visibleTenants.length > 0 ? (
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
                  <Box component="span" sx={styles.visuallyHidden}>
                    {accountT('actions')}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleTenants.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.3} alignItems="center" sx={styles.stack6}>
                      <Avatar aria-hidden sx={styles.avatar}>
                        {accountInitials(tenant.name)}
                      </Avatar>
                      <Box sx={styles.box4}>
                        <Box
                          component={Link}
                          href={{ pathname: '/platform/tenants/[id]', params: { id: tenant.id } }}
                          sx={styles.nameLink}
                        >
                          {tenant.name}
                        </Box>
                        <Typography sx={styles.slug}>{tenant.slug}</Typography>
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
                  <TableCell align="right" sx={styles.tableCell}>
                    {tenant.monthlyCharge ? (
                      <Tooltip title={describeCharge(tenant.monthlyCharge)}>
                        <Box component="span" sx={styles.box5}>
                          {formatPrice(tenant.monthlyCharge.total)}
                        </Box>
                      </Tooltip>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell sx={styles.tableCell}>
                    {format.dateTime(new Date(tenant.createdAt))}
                  </TableCell>
                  <TableCell align="right">
                    {canManage ? (
                      <Tooltip title={accountT('editAction', { name: tenant.name })}>
                        <IconButton
                          size="small"
                          aria-label={accountT('editAction', { name: tenant.name })}
                          onClick={() => setEditingTenant(tenant)}
                          sx={styles.iconButton2}
                        >
                          <EditOutlinedIcon sx={styles.editOutlinedIcon} />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Stack sx={styles.stack2} alignItems="center">
          <Typography color="text.secondary">{t('empty')}</Typography>
        </Stack>
      )}
      {data && data.totalCount > data.pageSize ? (
        <DashboardTablePagination
          count={data.totalCount}
          page={page}
          rowsPerPage={list.pageSize}
          rowsPerPageOptions={[...tenantsPageSizeOptions]}
          onPageChange={(nextPage) => updateFilters({ status, page: nextPage, scope })}
          onRowsPerPageChange={(pageSize) => updateFilters({ status, page: 1, pageSize, scope })}
        />
      ) : null}
      {editingTenant ? (
        <EditTenantAccountDialog tenant={editingTenant} onClose={() => setEditingTenant(null)} />
      ) : null}
    </Card>
  )
}

export function TenantsFilters({
  query,
  accountType,
  onQueryChange,
  onAccountTypeChange,
}: TenantsFiltersProps) {
  const tenantsT = useTranslations('platform.tenants')
  const accountT = useTranslations('platform.account')

  return (
    <>
      <TextField
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={tenantsT('search.placeholder')}
        size="small"
        sx={styles.filterSearch}
        slotProps={{
          htmlInput: { 'aria-label': tenantsT('search.label') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={styles.searchRoundedIcon} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Select
        value={accountType}
        onChange={(event) => onAccountTypeChange(toTenantTypeFilter(event.target.value))}
        inputProps={{ 'aria-label': tenantsT('filters.typeLabel') }}
        sx={styles.filterSelect}
      >
        <MenuItem value="ALL">{tenantsT('filters.allTypes')}</MenuItem>
        {TENANT_ACCOUNT_TYPES.map((type) => (
          <MenuItem key={type} value={type}>
            {accountT(`accountTypes.${type}`)}
          </MenuItem>
        ))}
      </Select>
    </>
  )
}
