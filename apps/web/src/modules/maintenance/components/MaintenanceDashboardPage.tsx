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
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import {
  DashboardNotificationsButton,
  DashboardPageHeader,
  DashboardTablePagination,
} from '@shared/components/layout'
import {
  maintenanceFilters,
  getMaintenanceTickets,
  maintenanceMetrics,
  maintenanceTickets,
  setMaintenanceTickets,
} from '../data/maintenance-tickets'
import type {
  MaintenanceCreateTicketFormValues,
  MaintenanceFilter,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
} from '../types/maintenance'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'
import { MaintenanceCreateTicketDialog } from './MaintenanceCreateTicketDialog'
import { getMaintenanceTicketDetail } from '../data/maintenance-ticket-detail'

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

export function MaintenanceDashboardPage() {
  const t = useTranslations('dashboard.maintenance')
  const [activeFilter, setActiveFilter] = useState<'all' | MaintenanceStatus | 'urgent'>('all')
  const [search, setSearch] = useState('')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(ticketsPerPage)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null)
  const [deletingTicket, setDeletingTicket] = useState<MaintenanceTicket | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [menuTicket, setMenuTicket] = useState<MaintenanceTicket | null>(null)
  const [tickets, setTickets] = useState<readonly MaintenanceTicket[]>(getMaintenanceTickets)
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
          (propertyFilter === 'all' || ticket.property === propertyFilter) &&
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

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  function getFilterCount(filter: MaintenanceFilter) {
    const matchesFilter = (ticket: MaintenanceTicket) =>
      filter.value === 'all' ||
      (filter.value === 'urgent' ? ticket.priority === 'urgent' : ticket.status === filter.value)
    return (
      filter.count +
      tickets.filter(matchesFilter).length -
      maintenanceTickets.filter(matchesFilter).length
    )
  }

  function handleActiveFilterChange(value: MaintenanceFilter['value']) {
    setActiveFilter(value)
    setCurrentPage(1)
  }

  function handlePropertyFilterChange(value: string) {
    setPropertyFilter(value)
    setCurrentPage(1)
  }

  function handleCreateTicket(values: MaintenanceCreateTicketFormValues) {
    const property = maintenanceProperties.find((option) => option.id === values.propertyId)
    if (!property) return

    const ticketNumbers = tickets
      .map((ticket) => Number(ticket.id.slice(-4)))
      .filter((ticketNumber) => Number.isFinite(ticketNumber))
    const nextNumber = (ticketNumbers.length > 0 ? Math.max(...ticketNumbers) : 89) + 1
    const ticket: MaintenanceTicket = {
      id: `#MNT-2025-${String(nextNumber).padStart(4, '0')}`,
      property: property.label,
      category: values.category,
      priority: values.priority,
      tenant: property.tenant,
      openedAt: new Intl.DateTimeFormat('pt-BR').format(new Date()),
      status: 'open',
      title: values.title,
      description: values.description,
    }

    setTickets((currentTickets) => {
      const nextTickets = [ticket, ...currentTickets]
      setMaintenanceTickets(nextTickets)
      return nextTickets
    })
    setCurrentPage(1)
    setIsCreateDialogOpen(false)
  }

  function closeMenu() {
    setMenuAnchor(null)
    setMenuTicket(null)
  }

  function getFormValues(ticket: MaintenanceTicket): MaintenanceCreateTicketFormValues {
    const detail = getMaintenanceTicketDetail(ticket)
    return {
      propertyId:
        maintenanceProperties.find((property) => property.label === ticket.property)?.id ?? '',
      category: ticket.category,
      priority: ticket.priority,
      title: detail.title,
      description: detail.description,
    }
  }

  function handleSaveTicket(values: MaintenanceCreateTicketFormValues) {
    if (!editingTicket) return
    const property = maintenanceProperties.find((option) => option.id === values.propertyId)
    if (!property) return
    setTickets((current) => {
      const nextTickets = current.map((ticket) =>
        ticket.id === editingTicket.id
          ? {
              ...ticket,
              property: property.label,
              tenant: property.tenant,
              category: values.category,
              priority: values.priority,
              title: values.title,
              description: values.description,
            }
          : ticket,
      )
      setMaintenanceTickets(nextTickets)
      return nextTickets
    })
    setEditingTicket(null)
    setIsCreateDialogOpen(false)
  }

  function handleDeleteTicket() {
    if (!deletingTicket) return
    setTickets((current) => {
      const nextTickets = current.filter((ticket) => ticket.id !== deletingTicket.id)
      setMaintenanceTickets(nextTickets)
      return nextTickets
    })
    setDeletingTicket(null)
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
                <SearchRoundedIcon sx={{ fontSize: 18, color: brand.neutral[400] }} />
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
        {maintenanceProperties.map((property) => (
          <MenuItem key={property.id} value={property.label}>
            {property.label}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="outlined"
        startIcon={<FilterListRoundedIcon sx={{ fontSize: 17 }} />}
        onClick={() => setIsFiltersDialogOpen(true)}
        aria-label={t('filterDialog.open')}
        sx={{
          display: { xs: 'inline-flex', md: 'none' },
          minHeight: 36,
          px: 2,
          borderRadius: `${radius.sm}px`,
          fontSize: 14,
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}
      >
        {t('filterDialog.open')}
      </Button>
      <Button
        variant="contained"
        startIcon={<AddRoundedIcon sx={{ fontSize: 17 }} />}
        onClick={() => setIsCreateDialogOpen(true)}
        sx={{
          minHeight: 36,
          px: 2,
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.none,
          fontSize: 14,
          fontWeight: 800,
          whiteSpace: 'nowrap',
        }}
      >
        {t('newTicket')}
      </Button>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
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
          {maintenanceMetrics.map((metric) => (
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
              {pagedTickets.map((ticket) => (
                <TableRow key={ticket.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
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
                          params: { id: ticket.id.slice(1) },
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
                          setMenuTicket(ticket)
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
          setEditingTicket(null)
        }}
        onCreate={editingTicket ? handleSaveTicket : handleCreateTicket}
        initialValues={editingTicket ? getFormValues(editingTicket) : undefined}
        mode={editingTicket ? 'edit' : 'create'}
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
              {maintenanceProperties.map((property) => (
                <MenuItem key={property.id} value={property.label}>
                  {property.label}
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
            setEditingTicket(menuTicket)
            setIsCreateDialogOpen(Boolean(menuTicket))
            closeMenu()
          }}
        >
          <EditOutlinedIcon sx={{ mr: 1, fontSize: 18 }} />
          {t('actions.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeletingTicket(menuTicket)
            closeMenu()
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlineRoundedIcon sx={{ mr: 1, fontSize: 18 }} />
          {t('actions.delete')}
        </MenuItem>
      </Menu>
      <Dialog open={Boolean(deletingTicket)} onClose={() => setDeletingTicket(null)}>
        <DialogTitle>{t('actions.deleteTitle')}</DialogTitle>
        <DialogContent>{t('actions.deleteDescription')}</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingTicket(null)}>{t('createDialog.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteTicket}>
            {t('actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

const maintenanceProperties = [
  { id: 'apt-jardins-3q', label: 'Apt Jardins 3q', tenant: 'Bruno Oliveira' },
  { id: 'studio-pinheiros', label: 'Studio Pinheiros', tenant: 'Mariana Souza' },
  { id: 'casa-vila-madalena', label: 'Casa Vila Madalena', tenant: 'Felipe Neto' },
  { id: 'cobertura-moema', label: 'Cobertura Moema', tenant: 'Aline Santos' },
] as const

const compactFieldSx = {
  width: { xs: '100%', sm: 200 },
  '& .MuiInputBase-root': {
    height: 36,
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 14,
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
  getFilterCount: (filter: MaintenanceFilter) => number
  isDesktop?: boolean
  onChange: (value: MaintenanceFilter['value']) => void
}) {
  const t = useTranslations('dashboard.maintenance')
  const activeOption =
    maintenanceFilters.find((filter) => filter.value === activeFilter) ?? maintenanceFilters[0]
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
              count={getFilterCount(activeOption)}
              label={t(`filters.${activeOption.value}`)}
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
        {maintenanceFilters.map((filter) => {
          const active = activeFilter === filter.value

          return (
            <MenuItem
              key={filter.value}
              value={filter.value}
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
                count={getFilterCount(filter)}
                label={t(`filters.${filter.value}`)}
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
          spacing={1}
          sx={{ display: { xs: 'none', md: 'flex' }, flexWrap: 'wrap', rowGap: 1 }}
        >
          {maintenanceFilters.map((filter) => {
            const active = activeFilter === filter.value

            return (
              <Button
                key={filter.value}
                type="button"
                variant={active ? 'contained' : 'outlined'}
                aria-pressed={active}
                onClick={() => onChange(filter.value)}
                sx={{
                  minHeight: 34,
                  borderRadius: `${radius.full}px`,
                  px: 1.8,
                  gap: 0.6,
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                {t(`filters.${filter.value}`)}
                <Box
                  component="span"
                  sx={{
                    display: 'grid',
                    minWidth: 20,
                    height: 20,
                    placeItems: 'center',
                    px: 0.5,
                    borderRadius: `${radius.full}px`,
                    bgcolor: active ? alpha.white[8] : alpha.graphite[6],
                    color: active ? surface.lightText : brand.neutral[500],
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  {getFilterCount(filter)}
                </Box>
              </Button>
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
          minWidth: 22,
          height: 22,
          placeItems: 'center',
          px: 0.6,
          borderRadius: `${radius.full}px`,
          bgcolor: active ? brand.magenta[500] : alpha.graphite[6],
          color: active ? surface.lightText : brand.neutral[500],
          fontSize: 11,
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
