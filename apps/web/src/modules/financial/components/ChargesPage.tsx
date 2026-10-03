'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
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
} from '@mui/material'
import { useSnackbar } from 'notistack'
import { useTranslations, useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'

import { useRouter } from '@/i18n/navigation'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
  DashboardStatusFilterButton,
  DashboardTablePagination,
} from '@shared/components/layout'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import { formatCurrency } from '@shared/lib/utils/format'
import { useCharges, useCreateCharge, useUpdateCharge } from '../hooks/use-financial'
import { getMonthlyReceivable, mapChargeListItemFromApi } from '../utils/charge-adapter'
import { errorMessage } from '../utils/error-message'
import { chargeStatusColors as statusColors } from './charge-status-colors'
import type {
  Charge,
  ChargeDirection,
  ChargeStatus,
  CreateChargeFormValues,
  UpdateChargeFormValues,
} from '../types/charge'
import { ArchiveChargeDialog } from './ArchiveChargeDialog'
import { CreateChargeDialog } from './CreateChargeDialog'
import { EditChargeDialog } from './EditChargeDialog'

const defaultRowsPerPage = 6
const statusKeys: Array<'all' | ChargeStatus> = ['all', 'pending', 'overdue', 'paid', 'scheduled']

export function ChargesPage() {
  const t = useTranslations('charges')
  const locale = useLocale()
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const chargesQuery = useCharges(tenantId, { pageSize: 500 })
  const charges = useMemo(
    () => (chargesQuery.data?.items ?? []).map(mapChargeListItemFromApi),
    [chargesQuery.data],
  )
  const createChargeMutation = useCreateCharge(tenantId)
  const updateChargeMutation = useUpdateCharge(tenantId)
  const [direction, setDirection] = useState<ChargeDirection>('receivable')
  const [status, setStatus] = useState<'all' | ChargeStatus>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null)
  const [archivingChargeId, setArchivingChargeId] = useState<string | null>(null)
  const router = useRouter()
  const normalized = query.trim().toLocaleLowerCase(locale)
  const visible = useMemo(
    () =>
      charges.filter(
        (charge) =>
          charge.direction === direction &&
          (status === 'all' || charge.status === status) &&
          (!normalized ||
            [charge.code, charge.tenant, charge.property].some((item) =>
              item.toLocaleLowerCase(locale).includes(normalized),
            )),
      ),
    [charges, direction, locale, normalized, status],
  )
  const pageCount = Math.max(1, Math.ceil(visible.length / rowsPerPage))
  const currentPage = Math.min(page, pageCount)
  const rows = visible.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const editingCharge = charges.find((charge) => charge.id === editingChargeId) ?? null
  const receivables = charges.filter((charge) => charge.direction === 'receivable')
  const due = getMonthlyReceivable(charges)
  const overdue = receivables
    .filter((charge) => charge.status === 'overdue')
    .reduce((sum, charge) => sum + charge.amount, 0)
  const total = receivables
    .filter((charge) => charge.status !== 'cancelled')
    .reduce((sum, charge) => sum + charge.amount, 0)
  const selectStatus = (next: 'all' | ChargeStatus) => {
    setStatus(next)
    setPage(1)
  }
  const changeDirection = (_: unknown, next: ChargeDirection) => {
    if (next) {
      setDirection(next)
      setStatus('all')
      setPage(1)
    }
  }
  const addCharge = (values: CreateChargeFormValues) => {
    createChargeMutation.mutate(values, {
      onSuccess: () => {
        setQuery('')
        setDirection(values.direction)
        setStatus('all')
        setPage(1)
        setCreateOpen(false)
        enqueueSnackbar(t('createDialog.success'), { variant: 'success' })
      },
      onError: (error) => {
        enqueueSnackbar(errorMessage(error, t('createDialog.error')), { variant: 'error' })
      },
    })
  }
  const updateCharge = (id: string, values: UpdateChargeFormValues) => {
    updateChargeMutation.mutate(
      { id, values },
      {
        onSuccess: () => {
          setEditingChargeId(null)
          enqueueSnackbar(t('feedback.updated'), { variant: 'success' })
        },
        onError: (error) => {
          enqueueSnackbar(errorMessage(error, t('feedback.updateError')), { variant: 'error' })
        },
      },
    )
  }
  const archiveCharge = () => {
    if (!archivingChargeId) return
    const charge = charges.find((item) => item.id === archivingChargeId)
    if (!charge) return
    updateChargeMutation.mutate(
      {
        id: charge.id,
        values: {
          description: charge.description ?? '',
          amount: charge.amount,
          dueDate: charge.dueDate,
          direction: charge.direction,
          status: 'cancelled',
        },
      },
      {
        onSuccess: () => {
          setArchivingChargeId(null)
          enqueueSnackbar(t('feedback.archived'), { variant: 'success' })
        },
        onError: (error) => {
          enqueueSnackbar(errorMessage(error, t('feedback.archiveError')), { variant: 'error' })
        },
      },
    )
  }
  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={{ xs: 2, md: 2.7 }}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          sx={{ pb: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}
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
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder={t('searchPlaceholder')}
                size="small"
                slotProps={{
                  htmlInput: { 'aria-label': t('searchPlaceholder') },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  width: { xs: '100%', sm: 250 },
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
                  '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: iconSize.sm },
                }}
              />
              <DashboardHeaderActionButton
                startIcon={<AddRoundedIcon />}
                onClick={() => setCreateOpen(true)}
              >
                {t('newCharge')}
              </DashboardHeaderActionButton>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <DashboardNotificationsButton />
              </Box>
            </Stack>
          }
        />
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={1.2}
          sx={{ mt: { xs: '14px !important', md: '14px !important' } }}
        >
          <Stack
            component="div"
            role="group"
            aria-label="Filtrar cobrancas por status"
            direction="row"
            spacing={0.8}
            useFlexGap
            flexWrap="wrap"
            sx={{
              minWidth: 0,
            }}
          >
            {statusKeys.map((item) => {
              const active = status === item
              const count = charges.filter(
                (charge) =>
                  charge.direction === direction && (item === 'all' || charge.status === item),
              ).length
              return (
                <DashboardStatusFilterButton
                  key={item}
                  active={active}
                  count={count}
                  onClick={() => selectStatus(item)}
                >
                  {t(`statuses.${item}`)}
                </DashboardStatusFilterButton>
              )
            })}
          </Stack>
          <Tabs
            value={direction}
            onChange={changeDirection}
            sx={{
              minHeight: 36,
              alignSelf: { xs: 'stretch', md: 'flex-end' },
              '& .MuiTabs-flexContainer': {
                justifyContent: { xs: 'stretch', md: 'flex-end' },
              },
              '& .MuiTab-root': {
                minHeight: 36,
                px: { xs: 0, sm: 2 },
                flex: { xs: 1, md: 'initial' },
                whiteSpace: 'nowrap',
                textTransform: 'none',
                color: brand.neutral[500],
                fontSize: 12,
                fontWeight: 700,
              },
              '& .Mui-selected': { color: 'primary.main' },
              '& .MuiTabs-indicator': { height: 2 },
            }}
          >
            <Tab value="receivable" label={t('tabs.receivable')} />
            <Tab value="payable" label={t('tabs.payable')} />
          </Tabs>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
            gap: { xs: 1.4, md: 1.8 },
          }}
        >
          <Metric
            label={t('kpis.receivable')}
            value={formatCurrency(due)}
            icon={<TrendingUpRoundedIcon />}
            tone="success"
          />
          <Metric
            label={t('kpis.overdue')}
            value={formatCurrency(overdue)}
            icon={<TrendingDownRoundedIcon />}
            tone="error"
          />
          <Metric
            label={t('kpis.defaultRate')}
            value={total ? `${((overdue / total) * 100).toFixed(1)}%` : '0%'}
            icon={<TrendingDownRoundedIcon />}
            tone="warning"
          />
        </Box>
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderColor: alpha.graphite[6],
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            boxShadow: shadows.propertyCard,
          }}
        >
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table
              size="small"
              sx={{
                width: '100%',
                minWidth: 840,
                '& .MuiTableCell-root': { borderColor: 'divider' },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  px: 1.5,
                  py: 0,
                  color: brand.neutral[500],
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                },
                '& .MuiTableHead-root .MuiTableCell-root:last-of-type': { textAlign: 'center' },
                '& .MuiTableBody-root .MuiTableCell-root': {
                  px: 1.5,
                  py: 0,
                  fontSize: 15.5,
                  lineHeight: 1.3,
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ height: 44, bgcolor: surface.app }}>
                  {['code', 'tenant', 'property', 'amount', 'dueDate', 'status', 'actions'].map(
                    (key) => (
                      <TableCell key={key}>{t(`table.${key}`)}</TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((charge, index) => (
                  <ChargeRow
                    key={charge.id}
                    charge={charge}
                    locale={locale}
                    zebra={index % 2 === 1}
                    labels={{
                      actions: t('table.actions'),
                      view: t('detailsDialog.title'),
                      edit: t('actions.edit'),
                      archive: t('actions.archive'),
                      status: t(`statuses.${charge.status}`),
                    }}
                    onEdit={() => setEditingChargeId(charge.id)}
                    onArchive={() => setArchivingChargeId(charge.id)}
                    onView={() =>
                      router.push({
                        pathname: '/dashboard/finance/charges/[id]',
                        params: { id: charge.id },
                      })
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <DashboardTablePagination
            count={visible.length}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[6, 10, 25]}
            onPageChange={setPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setPage(1)
            }}
          />
        </Paper>
      </Stack>
      <CreateChargeDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={addCharge}
      />
      <EditChargeDialog
        charge={editingCharge}
        onClose={() => setEditingChargeId(null)}
        onSave={updateCharge}
      />
      <ArchiveChargeDialog
        open={Boolean(archivingChargeId)}
        onClose={() => setArchivingChargeId(null)}
        onConfirm={archiveCharge}
      />
    </Box>
  )
}

function Metric({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'success' | 'error' | 'warning'
}) {
  const colors = {
    success: statusColors.paid.bg,
    error: statusColors.overdue.bg,
    warning: statusColors.pending.bg,
  }
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        minHeight: 76,
        p: 2,
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmCardCompact,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          placeItems: 'center',
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: '50%',
          bgcolor: colors[tone],
          color:
            tone === 'error' ? 'error.main' : tone === 'success' ? 'success.main' : 'warning.dark',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        <Typography sx={{ fontSize: 11.5, color: brand.neutral[500] }}>{label}</Typography>
        <Typography sx={{ fontSize: { xs: 19, md: 20 }, fontWeight: 900 }}>{value}</Typography>
      </Box>
    </Stack>
  )
}
function ChargeRow({
  charge,
  locale,
  zebra,
  labels,
  onEdit,
  onArchive,
  onView,
}: {
  charge: Charge
  locale: string
  zebra: boolean
  labels: Record<string, string>
  onEdit: () => void
  onArchive: () => void
  onView: () => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const style = statusColors[charge.status]
  return (
    <TableRow
      sx={{
        height: 58,
        bgcolor: zebra ? surface.app : surface.paper,
        '&:hover': { bgcolor: alpha.graphite[6] },
      }}
    >
      <TableCell>
        <Button
          aria-label={`${labels.view} ${charge.code}`}
          onClick={onView}
          variant="text"
          sx={{ minWidth: 0, p: 0, color: brand.graphite[500], fontSize: 15.5, fontWeight: 900 }}
        >
          {charge.code}
        </Button>
      </TableCell>
      <TableCell>{charge.tenant}</TableCell>
      <TableCell>
        <Typography noWrap sx={{ color: 'text.secondary', fontSize: 14 }}>
          {charge.property}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: 800, fontSize: 15.5 }}>
          {formatCurrency(charge.amount)}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ color: 'text.secondary', fontSize: 15.5 }}>
          {new Intl.DateTimeFormat(locale).format(new Date(`${charge.dueDate}T12:00:00`))}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={labels.status}
          size="small"
          sx={{
            height: 30,
            bgcolor: style.bg,
            color: style.color,
            borderRadius: `${radius.full}px`,
            fontWeight: 900,
            fontSize: 13,
          }}
        />
      </TableCell>
      <TableCell>
        <Stack direction="row" justifyContent="center" alignItems="center">
          <Tooltip title={labels.view}>
            <IconButton
              aria-label={`${labels.view} ${charge.code}`}
              onClick={onView}
              size="small"
              sx={{ color: brand.neutral[500], '&:hover': { color: 'primary.main' } }}
            >
              <VisibilityOutlinedIcon sx={{ fontSize: iconSize.md }} />
            </IconButton>
          </Tooltip>
          <IconButton
            aria-label={`${labels.actions} ${charge.code}`}
            onClick={(event: MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget)}
            size="small"
            sx={{ color: brand.neutral[500], '&:hover': { color: 'primary.main' } }}
          >
            <MoreVertRoundedIcon sx={{ fontSize: iconSize.md }} />
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem
              onClick={() => {
                onEdit()
                setAnchor(null)
              }}
            >
              {labels.edit}
            </MenuItem>
            <MenuItem
              onClick={() => {
                onArchive()
                setAnchor(null)
              }}
            >
              {labels.archive}
            </MenuItem>
          </Menu>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
