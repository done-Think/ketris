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
  Pagination,
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

import { useRouter } from '@/i18n/navigation'
import {
  DashboardNotificationsButton,
  DashboardPageHeader,
  dashboardHeaderActionButtonSx,
} from '@shared/components/layout'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import { getMonthlyReceivable, useChargesStore } from '../stores/charges-store'
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

const pageSize = 6
const statusKeys: Array<'all' | ChargeStatus> = ['all', 'pending', 'overdue', 'paid', 'scheduled']

function currency(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(value)
}

export function ChargesPage() {
  const t = useTranslations('charges')
  const locale = useLocale()
  const { enqueueSnackbar } = useSnackbar()
  const {
    charges,
    addCharge: createCharge,
    updateCharge: saveCharge,
    archiveCharge: removeCharge,
  } = useChargesStore()
  const [direction, setDirection] = useState<ChargeDirection>('receivable')
  const [status, setStatus] = useState<'all' | ChargeStatus>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
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
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const rows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)
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
    createCharge(values)
    setQuery('')
    setDirection(values.direction)
    setStatus('all')
    setPage(1)
    setCreateOpen(false)
    enqueueSnackbar(t('createDialog.success'), { variant: 'success' })
  }
  const updateCharge = (id: string, values: UpdateChargeFormValues) => {
    saveCharge(id, values)
    setEditingChargeId(null)
    enqueueSnackbar(t('feedback.updated'), { variant: 'success' })
  }
  const archiveCharge = () => {
    if (!archivingChargeId) return
    removeCharge(archivingChargeId)
    setArchivingChargeId(null)
    enqueueSnackbar(t('feedback.archived'), { variant: 'success' })
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
                  '& .MuiOutlinedInput-root': {
                    bgcolor: surface.paper,
                    borderRadius: `${radius.sm}px`,
                    height: 36,
                    fontSize: 14,
                    fontWeight: 600,
                  },
                  '& .MuiInputBase-input': { py: 0 },
                  '& .MuiInputAdornment-root .MuiSvgIcon-root': { fontSize: iconSize.sm },
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => setCreateOpen(true)}
                sx={dashboardHeaderActionButtonSx}
              >
                {t('newCharge')}
              </Button>
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
                <Button
                  key={item}
                  type="button"
                  variant="text"
                  aria-pressed={active}
                  onClick={() => selectStatus(item)}
                  sx={{
                    minWidth: 0,
                    minHeight: 42,
                    px: 1.8,
                    flexShrink: 0,
                    gap: 0.6,
                    border: 0,
                    borderRadius: `${radius.full}px`,
                    bgcolor: active ? brand.magenta[500] : brand.neutral[50],
                    color: active ? surface.lightText : brand.graphite[500],
                    fontSize: 17,
                    fontWeight: 900,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: active ? brand.magenta[600] : brand.neutral[100],
                      border: 0,
                      boxShadow: 'none',
                    },
                  }}
                >
                  {t(`statuses.${item}`)}
                  <Box
                    component="span"
                    sx={{
                      display: 'grid',
                      minWidth: 24,
                      height: 24,
                      placeItems: 'center',
                      px: 0.5,
                      borderRadius: `${radius.full}px`,
                      bgcolor: active ? alpha.white[8] : alpha.graphite[6],
                      color: active ? surface.lightText : brand.neutral[500],
                      fontSize: 14.5,
                      fontWeight: 800,
                    }}
                  >
                    {count}
                  </Box>
                </Button>
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
            value={currency(due, locale)}
            icon={<TrendingUpRoundedIcon />}
            tone="success"
          />
          <Metric
            label={t('kpis.overdue')}
            value={currency(overdue, locale)}
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
        <Box
          sx={{
            bgcolor: surface.paper,
            borderRadius: `${radius.md}px`,
            boxShadow: shadows.crmCardCompact,
            overflow: 'hidden',
            p: { xs: 1, md: 2 },
          }}
        >
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table
              size="small"
              sx={{
                width: '100%',
                minWidth: 840,
                '& .MuiTableCell-head': {
                  bgcolor: brand.neutral[50],
                  color: brand.neutral[500],
                  fontSize: 10.5,
                  fontWeight: 900,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  textAlign: 'left',
                  borderBottom: '1px solid',
                  borderColor: alpha.graphite[6],
                  px: 1.5,
                  py: 1.35,
                },
                '& .MuiTableCell-head:last-child': { textAlign: 'center' },
                '& .MuiTableCell-body': {
                  borderColor: alpha.graphite[6],
                  px: 1.5,
                  py: 1.2,
                  fontSize: 13,
                  color: brand.graphite[500],
                },
                '& .MuiTableRow-root:last-child .MuiTableCell-body': { borderBottom: 0 },
                '& .MuiTableBody-root .MuiTableRow-root:hover': { bgcolor: brand.neutral[50] },
              }}
            >
              <TableHead>
                <TableRow>
                  {['code', 'tenant', 'property', 'amount', 'dueDate', 'status', 'actions'].map(
                    (key) => (
                      <TableCell key={key}>{t(`table.${key}`)}</TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((charge) => (
                  <ChargeRow
                    key={charge.id}
                    charge={charge}
                    locale={locale}
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
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ pt: 1.5, px: { xs: 0.5, md: 0 }, pb: 0 }}
          >
            <Typography sx={{ color: brand.neutral[500], fontSize: 12 }}>
              {t('pagination.summary', {
                from: visible.length ? (currentPage - 1) * pageSize + 1 : 0,
                to: Math.min(currentPage * pageSize, visible.length),
                total: visible.length,
              })}
            </Typography>
            <Pagination
              count={pageCount}
              page={currentPage}
              onChange={(_, next) => setPage(next)}
              color="primary"
              size="small"
            />
          </Stack>
        </Box>
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
  labels,
  onEdit,
  onArchive,
  onView,
}: {
  charge: Charge
  locale: string
  labels: Record<string, string>
  onEdit: () => void
  onArchive: () => void
  onView: () => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const style = statusColors[charge.status]
  return (
    <TableRow>
      <TableCell>
        <Button
          aria-label={`${labels.view} ${charge.code}`}
          onClick={onView}
          variant="text"
          sx={{ minWidth: 0, p: 0, color: brand.graphite[500], fontSize: 13, fontWeight: 900 }}
        >
          {charge.code}
        </Button>
      </TableCell>
      <TableCell>{charge.tenant}</TableCell>
      <TableCell>
        <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>{charge.property}</Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
          {currency(charge.amount, locale)}
        </Typography>
      </TableCell>
      <TableCell>
        {new Intl.DateTimeFormat(locale).format(new Date(`${charge.dueDate}T12:00:00`))}
      </TableCell>
      <TableCell>
        <Chip
          label={labels.status}
          size="small"
          sx={{
            height: 21,
            bgcolor: style.bg,
            color: style.color,
            borderRadius: `${radius.full}px`,
            fontWeight: 800,
            fontSize: 10,
            '& .MuiChip-label': { px: 1 },
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
