'use client'

import { useEffect, useMemo, useState } from 'react'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Menu,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { Link } from '@/i18n/navigation'
import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
  DashboardStatusFilterButton,
  DashboardTablePagination,
} from '@shared/components/layout'
import { useProperties } from '@modules/properties/hooks/use-properties'

import {
  useCreateMaintenanceTicket,
  useDeleteMaintenanceTicket,
  useMaintenanceTicket,
  useMaintenanceTickets,
  useUpdateMaintenanceTicket,
} from '../hooks/use-maintenance'
import type {
  MaintenanceCreateTicketFormValues,
  MaintenanceFilter,
  MaintenanceMetric,
  MaintenancePriority,
  MaintenanceStatus,
} from '../types/maintenance'
import {
  buildUpdateMaintenanceTicketPayload,
  mapMaintenanceTicketListItemFromApi,
  mapMaintenanceTicketToFormValues,
} from '../utils/maintenance-adapter'
import { errorMessage } from '../utils/error-message'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'
import { MaintenanceCreateTicketDialog } from './MaintenanceCreateTicketDialog'

const statusStyles: Record<MaintenanceStatus, { bgcolor: string; color: string }> = {
  inProgress: { bgcolor: '#FFF2CC', color: '#D98900' },
  open: { bgcolor: '#E8F1FF', color: '#2877E8' },
  resolved: { bgcolor: '#E5F8ED', color: '#12A150' },
  closed: { bgcolor: '#EFF1F4', color: '#617086' },
}
const priorityColors: Record<MaintenancePriority, string> = {
  urgent: brand.semantic.error,
  high: '#F59E0B',
  normal: brand.neutral[400],
}

const ticketsPerPage = 5
const maintenanceFilterValues: MaintenanceFilter['value'][] = [
  'all',
  'open',
  'inProgress',
  'urgent',
  'resolved',
  'closed',
]

export function MaintenanceDashboardPage() {
  const t = useTranslations('dashboard.maintenance')
  const { enqueueSnackbar } = useSnackbar()
  const { data: session } = useSession()
  const tenantId = session?.tenantId
  const [activeFilter, setActiveFilter] = useState<'all' | MaintenanceStatus | 'urgent'>('all')
  const [search, setSearch] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(ticketsPerPage)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false)
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [menuTicketId, setMenuTicketId] = useState<string | null>(null)

  const ticketsQuery = useMaintenanceTickets(tenantId, { pageSize: 100 })
  const propertiesQuery = useProperties()
  const editTicketQuery = useMaintenanceTicket(tenantId, editingTicketId)
  const createMutation = useCreateMaintenanceTicket(tenantId)
  const updateMutation = useUpdateMaintenanceTicket(tenantId)
  const deleteMutation = useDeleteMaintenanceTicket(tenantId)

  const properties = propertiesQuery.data ?? []
  const tickets = useMemo(
    () => (ticketsQuery.data?.items ?? []).map(mapMaintenanceTicketListItemFromApi),
    [ticketsQuery.data],
  )

  const filteredTickets = useMemo(
    () =>
      tickets.filter((ticket) => {
        const matchesFilter =
          activeFilter === 'all' ||
          (activeFilter === 'urgent'
            ? ticket.priority === 'urgent'
            : ticket.status === activeFilter)
        const normalized = search.trim().toLocaleLowerCase('pt-BR')
        return (
          matchesFilter &&
          (propertyFilter === 'all' || ticket.propertyId === propertyFilter) &&
          (!normalized ||
            [ticket.id, ticket.property, ticket.category, ticket.tenant].some((value) =>
              value.toLocaleLowerCase('pt-BR').includes(normalized),
            ))
        )
      }),
    [activeFilter, propertyFilter, search, tickets],
  )
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / rowsPerPage))
  const pagedTickets = filteredTickets.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  )

  const metrics = useMemo<MaintenanceMetric[]>(() => {
    const openCount = tickets.filter((ticket) => ticket.status === 'open').length
    const urgentCount = tickets.filter((ticket) => ticket.priority === 'urgent').length
    const resolvedItems = (ticketsQuery.data?.items ?? []).filter((item) => item.resolvedAt)
    const averageResolutionDays =
      resolvedItems.length > 0
        ? resolvedItems.reduce(
            (total, item) =>
              total + dayjs(item.resolvedAt).diff(dayjs(item.createdAt), 'day', true),
            0,
          ) / resolvedItems.length
        : null

    const result: MaintenanceMetric[] = [
      { label: 'open', value: String(openCount) },
      { label: 'urgent', value: String(urgentCount) },
    ]

    if (averageResolutionDays !== null) {
      result.push({
        label: 'averageResolution',
        value: t('metrics.averageResolutionUnit', { days: averageResolutionDays.toFixed(1) }),
      })
    }

    return result
  }, [t, ticketsQuery.data, tickets])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  function getFilterCount(value: MaintenanceFilter['value']) {
    return tickets.filter(
      (ticket) =>
        value === 'all' ||
        (value === 'urgent' ? ticket.priority === 'urgent' : ticket.status === value),
    ).length
  }

  function handleActiveFilterChange(value: MaintenanceFilter['value']) {
    setActiveFilter(value)
    setCurrentPage(1)
  }

  function handlePropertyFilterChange(value: string) {
    setPropertyFilter(value)
    setCurrentPage(1)
  }

  async function handleCreateTicket(values: MaintenanceCreateTicketFormValues) {
    try {
      await createMutation.mutateAsync(values)
      enqueueSnackbar(t('notifications.createSuccess'), { variant: 'success' })
      setCurrentPage(1)
      setIsCreateDialogOpen(false)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.createError')), { variant: 'error' })
    }
  }

  function closeMenu() {
    setMenuAnchor(null)
    setMenuTicketId(null)
  }

  const initialValues =
    editingTicketId && editTicketQuery.data
      ? mapMaintenanceTicketToFormValues(editTicketQuery.data)
      : undefined

  async function handleSaveTicket(values: MaintenanceCreateTicketFormValues) {
    if (!editingTicketId) return
    try {
      await updateMutation.mutateAsync({
        id: editingTicketId,
        payload: buildUpdateMaintenanceTicketPayload(values),
      })
      enqueueSnackbar(t('notifications.updateSuccess'), { variant: 'success' })
      setEditingTicketId(null)
      setIsCreateDialogOpen(false)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.updateError')), { variant: 'error' })
    }
  }

  async function handleDeleteTicket() {
    if (!deletingTicketId) return
    try {
      await deleteMutation.mutateAsync(deletingTicketId)
      enqueueSnackbar(t('notifications.deleteSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('notifications.deleteError')), { variant: 'error' })
    } finally {
      setDeletingTicketId(null)
    }
  }

  const headerActions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.2}
      sx={{ width: { xs: '100%', lg: 'auto' }, alignItems: { sm: 'center' } }}
    >
      <TextField
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setCurrentPage(1)
        }}
        placeholder={t('search')}
        size="small"
        sx={compactFieldSx}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 16, color: brand.neutral[400] }} />
              </InputAdornment>
            ),
          },
        }}
      />
      <TextField
        select
        value={propertyFilter}
        onChange={(event) => handlePropertyFilterChange(event.target.value)}
        size="small"
        sx={{
          ...compactFieldSx,
          width: { xs: '100%', sm: 180 },
          display: { xs: 'none', md: 'block' },
          '& .MuiSelect-select': { pr: 4.5 },
        }}
      >
        <MenuItem value="all">
          <Stack direction="row" spacing={0.7} alignItems="center">
            <ApartmentOutlinedIcon sx={{ fontSize: 17 }} />
            <span>{t('allProperties')}</span>
          </Stack>
        </MenuItem>
        {properties.map((property) => (
          <MenuItem key={property.id} value={property.id}>
            {property.title}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        startIcon={<FilterListRoundedIcon sx={{ fontSize: 16 }} />}
        onClick={() => setIsFiltersDialogOpen(true)}
        aria-label={t('filterDialog.open')}
        sx={{
          display: { xs: 'inline-flex', md: 'none' },
          height: { xs: 40, sm: 32 },
          px: 1.5,
          borderRadius: `${radius.sm}px`,
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {t('filterDialog.open')}
      </Button>
      <DashboardHeaderActionButton
        startIcon={<AddRoundedIcon sx={{ fontSize: 16 }} />}
        onClick={() => setIsCreateDialogOpen(true)}
      >
        {t('newTicket')}
      </DashboardHeaderActionButton>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={{ xs: 2, md: 2.7 }}>
        <DashboardPageHeader title={t('title')} subtitle={t('subtitle')} actions={headerActions} />
        <MaintenanceStatusFilters
          activeFilter={activeFilter}
          getFilterCount={getFilterCount}
          onChange={handleActiveFilterChange}
          isDesktop
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(3, minmax(0, 1fr))',
              sm: 'repeat(3, minmax(0, 1fr))',
            },
            gap: { xs: 0.8, sm: 1.8 },
          }}
        >
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={t(`metrics.${metric.label}`)}
              value={metric.value}
              tone={metric.label}
            />
          ))}
        </Box>
        <TableContainer
          sx={{
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            boxShadow: shadows.crmCardCompact,
            overflowX: 'auto',
          }}
        >
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                {[
                  'ticket',
                  'property',
                  'category',
                  'priority',
                  'tenant',
                  'openedAt',
                  'status',
                  'actions',
                ].map((column) => (
                  <TableCell
                    key={column}
                    align={column === 'actions' ? 'center' : undefined}
                    sx={headerCellSx}
                  >
                    {t(`columns.${column}`)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedTickets.map((ticket, index) => (
                <TableRow
                  key={ticket.id}
                  sx={{
                    bgcolor: index % 2 === 1 ? surface.app : surface.paper,
                    transition: 'background-color 160ms ease',
                    '&:hover': { bgcolor: alpha.graphite[6] },
                    '&:last-child td': { borderBottom: 0 },
                  }}
                >
                  <TableCell sx={{ ...bodyCellSx, color: 'primary.main', fontWeight: 900 }}>
                    {ticket.id}
                  </TableCell>
                  <TableCell sx={{ ...bodyCellSx, fontWeight: 900 }}>{ticket.property}</TableCell>
                  <TableCell sx={bodyCellSx}>{ticket.category}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Stack direction="row" spacing={0.65} alignItems="center">
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: priorityColors[ticket.priority],
                        }}
                      />
                      <span>{t(`priorities.${ticket.priority}`)}</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{ticket.tenant}</TableCell>
                  <TableCell sx={{ ...bodyCellSx, color: brand.neutral[400] }}>
                    {ticket.openedAt}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Chip
                      label={t(`statuses.${ticket.status}`)}
                      size="small"
                      sx={{
                        height: 22,
                        bgcolor: statusStyles[ticket.status].bgcolor,
                        color: statusStyles[ticket.status].color,
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx} align="center">
                    <Stack direction="row" spacing={0.4} justifyContent="center">
                      <IconButton
                        component={Link}
                        href={{
                          pathname: '/dashboard/maintenance/[id]',
                          params: { id: ticket.id },
                        }}
                        aria-label={t('viewTicket', { ticket: ticket.id })}
                        size="small"
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: `${radius.sm}px`,
                          bgcolor: surface.app,
                          color: brand.graphite[500],
                        }}
                      >
                        <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        aria-label={t('actions.menu', { ticket: ticket.id })}
                        size="small"
                        onClick={(event) => {
                          setMenuAnchor(event.currentTarget)
                          setMenuTicketId(ticket.id)
                        }}
                        sx={{ width: 30, height: 30, color: brand.graphite[500] }}
                      >
                        <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {pagedTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={bodyCellSx}>
                    Nenhum chamado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DashboardTablePagination
            count={filteredTickets.length}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={(nextRowsPerPage) => {
              setRowsPerPage(nextRowsPerPage)
              setCurrentPage(1)
            }}
          />
        </TableContainer>
      </Stack>
      <MaintenanceCreateTicketDialog
        open={isCreateDialogOpen}
        onClose={() => {
          setIsCreateDialogOpen(false)
          setEditingTicketId(null)
        }}
        onCreate={editingTicketId ? handleSaveTicket : handleCreateTicket}
        initialValues={initialValues}
        mode={editingTicketId ? 'edit' : 'create'}
      />
      <Dialog
        open={isFiltersDialogOpen}
        onClose={() => setIsFiltersDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="maintenance-filters-title"
        slotProps={{
          paper: {
            sx: {
              borderRadius: `${radius.sm}px`,
              maxHeight: 'calc(100% - 32px)',
            },
          },
        }}
      >
        <DialogTitle
          id="maintenance-filters-title"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
        >
          {t('filterDialog.title')}
          <IconButton
            aria-label={t('filterDialog.close')}
            onClick={() => setIsFiltersDialogOpen(false)}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              select
              label={t('filterDialog.property')}
              value={propertyFilter}
              onChange={(event) => handlePropertyFilterChange(event.target.value)}
              fullWidth
              sx={compactFieldSx}
            >
              <MenuItem value="all">{t('allProperties')}</MenuItem>
              {properties.map((property) => (
                <MenuItem key={property.id} value={property.id}>
                  {property.title}
                </MenuItem>
              ))}
            </TextField>
            <MaintenanceStatusFilters
              activeFilter={activeFilter}
              direction="column"
              getFilterCount={getFilterCount}
              onChange={handleActiveFilterChange}
            />
          </Stack>
        </DialogContent>
      </Dialog>
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            setEditingTicketId(menuTicketId)
            setIsCreateDialogOpen(Boolean(menuTicketId))
            closeMenu()
          }}
        >
          <EditOutlinedIcon sx={{ mr: 1, fontSize: 18 }} />
          {t('actions.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeletingTicketId(menuTicketId)
            closeMenu()
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlineRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
          {t('actions.delete')}
        </MenuItem>
      </Menu>
      <Dialog open={Boolean(deletingTicketId)} onClose={() => setDeletingTicketId(null)}>
        <DialogTitle>{t('actions.deleteTitle')}</DialogTitle>
        <DialogContent>{t('actions.deleteDescription')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingTicketId(null)}>{t('createDialog.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteTicket}>
            {t('actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

const compactFieldSx = {
  width: { xs: '100%', sm: 200 },
  '& .MuiInputBase-root': {
    height: { xs: 40, sm: 32 },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 12,
    color: brand.neutral[600],
  },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha.graphite[8] },
} as const
const headerCellSx = {
  height: 40,
  px: 1.75,
  py: 0.8,
  bgcolor: surface.app,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '.07em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
} as const
const bodyCellSx = {
  height: 54,
  px: 1.75,
  py: 0.8,
  borderColor: brand.neutral[100],
  color: brand.neutral[600],
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const
function MaintenanceStatusFilters({
  activeFilter,
  direction = 'row',
  getFilterCount,
  isDesktop = false,
  onChange,
}: {
  activeFilter: MaintenanceFilter['value']
  direction?: 'row' | 'column'
  getFilterCount: (value: MaintenanceFilter['value']) => number
  isDesktop?: boolean
  onChange: (value: MaintenanceFilter['value']) => void
}) {
  const t = useTranslations('dashboard.maintenance')
  const isColumn = direction === 'column'

  return (
    <>
      <TextField
        select
        size="small"
        value={activeFilter}
        onChange={(event) => onChange(event.target.value as MaintenanceFilter['value'])}
        sx={{
          display: isDesktop ? { xs: 'flex', md: 'none' } : 'flex',
          width: isColumn ? '100%' : { xs: '100%', sm: 160 },
          '& .MuiOutlinedInput-root': {
            minHeight: 46,
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            color: brand.graphite[500],
            fontSize: 14,
            fontWeight: 800,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
              borderWidth: 0,
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
            borderWidth: 0,
          },
          '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'transparent',
          },
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
          },
        }}
        SelectProps={{
          inputProps: { 'aria-label': t('filterDialog.title') },
          renderValue: () => (
            <MaintenanceFilterOptionLabel
              active
              count={getFilterCount(activeFilter)}
              label={t(`filters.${activeFilter}`)}
            />
          ),
          MenuProps: {
            PaperProps: {
              sx: {
                mt: 0.6,
                borderRadius: `${radius.sm}px`,
                boxShadow: shadows.popover,
              },
            },
          },
        }}
      >
        {maintenanceFilterValues.map((value) => {
          const active = activeFilter === value

          return (
            <MenuItem
              key={value}
              value={value}
              sx={{
                minHeight: 42,
                bgcolor: active ? alpha.magenta[8] : 'transparent',
                '&:hover': {
                  bgcolor: alpha.magenta[8],
                },
              }}
            >
              <MaintenanceFilterOptionLabel
                active={active}
                count={getFilterCount(value)}
                label={t(`filters.${value}`)}
              />
            </MenuItem>
          )
        })}
      </TextField>

      {isDesktop ? (
        <Stack
          component="div"
          role="group"
          aria-label={t('filterDialog.title')}
          direction="row"
          spacing={0.8}
          useFlexGap
          flexWrap="wrap"
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          {maintenanceFilterValues.map((value) => {
            const active = activeFilter === value

            return (
              <DashboardStatusFilterButton
                key={value}
                active={active}
                count={getFilterCount(value)}
                onClick={() => onChange(value)}
              >
                {t(`filters.${value}`)}
              </DashboardStatusFilterButton>
            )
          })}
        </Stack>
      ) : null}
    </>
  )
}

function MaintenanceFilterOptionLabel({
  active,
  count,
  label,
}: {
  active: boolean
  count: number
  label: string
}) {
  return (
    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
      <Box component="span">{label}</Box>
      <Box
        component="span"
        sx={{
          display: 'grid',
          minWidth: 26,
          height: 26,
          placeItems: 'center',
          px: 0.6,
          borderRadius: `${radius.full}px`,
          bgcolor: active ? brand.magenta[500] : alpha.graphite[6],
          color: active ? surface.lightText : brand.neutral[500],
          fontSize: 15,
          fontWeight: 900,
        }}
      >
        {count}
      </Box>
    </Box>
  )
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'open' | 'urgent' | 'averageResolution'
}) {
  const config =
    tone === 'open'
      ? { Icon: FolderOpenOutlinedIcon, bg: '#E5F3FF', color: '#2877E8' }
      : tone === 'urgent'
        ? { Icon: WarningAmberRoundedIcon, bg: '#FDEBEC', color: brand.semantic.error }
        : { Icon: AccessTimeOutlinedIcon, bg: '#FFF5D8', color: '#D98900' }
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={{ xs: 0.5, sm: 1.3 }}
      sx={{
        minWidth: 0,
        minHeight: { xs: 84, sm: 78 },
        overflow: 'hidden',
        px: { xs: 1.2, sm: 2.1 },
        py: { xs: 1.3, sm: 1.5 },
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmCardCompact,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          display: { xs: 'none', sm: 'grid' },
          placeItems: 'center',
          bgcolor: config.bg,
          color: config.color,
        }}
      >
        <config.Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Typography
          noWrap
          sx={{
            width: '100%',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: brand.neutral[500],
            fontSize: { xs: 10, sm: 12 },
            fontWeight: 900,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            color: brand.graphite[500],
            fontSize: { xs: 24, sm: 30 },
            lineHeight: 1.1,
            fontWeight: 900,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}
