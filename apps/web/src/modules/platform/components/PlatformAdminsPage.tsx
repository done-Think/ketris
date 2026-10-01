'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import {
  DashboardHeaderActionButton,
  DashboardPageHeader,
  DashboardTablePagination,
} from '@shared/components/layout'
import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

import { useDeactivatePlatformAdmin } from '../hooks/use-deactivate-platform-admin'
import { useActivatePlatformAdmin } from '../hooks/use-activate-platform-admin'
import { usePlatformAdmins } from '../hooks/use-platform-admins'
import type { PlatformAdminAccount, PlatformAdminRole } from '../types/platform-admin'
import { CreatePlatformAdminDialog } from './CreatePlatformAdminDialog'
import { EditPlatformAdminDialog } from './EditPlatformAdminDialog'

const defaultPageSize = 10

export function PlatformAdminsPage() {
  const t = useTranslations('platform.admins')
  const adminsQuery = usePlatformAdmins()
  const deactivateAdmin = useDeactivatePlatformAdmin()
  const activateAdmin = useActivatePlatformAdmin()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [role, setRole] = useState<'all' | PlatformAdminRole>('all')
  const [page, setPage] = useState(1)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<PlatformAdminAccount | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState<PlatformAdminAccount | null>(null)

  const admins = useMemo(() => adminsQuery.data ?? [], [adminsQuery.data])
  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()

    return admins.filter((admin) => {
      const matchesSearch =
        !query || `${admin.nome} ${admin.email}`.toLocaleLowerCase().includes(query)
      const matchesStatus = status === 'all' || (status === 'active' ? admin.ativo : !admin.ativo)
      const matchesRole = role === 'all' || admin.role === role

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [admins, role, search, status])
  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / defaultPageSize))
  const currentPage = Math.min(page, totalPages)
  const pageAdmins = filteredAdmins.slice(
    (currentPage - 1) * defaultPageSize,
    currentPage * defaultPageSize,
  )

  function resetFilters() {
    setSearch('')
    setStatus('all')
    setRole('all')
    setPage(1)
  }

  function openMenu(anchor: HTMLElement, admin: PlatformAdminAccount) {
    setMenuAnchor(anchor)
    setSelectedAdmin(admin)
  }

  function closeMenu() {
    setMenuAnchor(null)
  }

  function requestDeactivation() {
    closeMenu()
  }

  async function requestActivation() {
    if (!selectedAdmin) return

    await activateAdmin.mutateAsync(selectedAdmin.id)
    setSelectedAdmin(null)
    closeMenu()
  }

  async function confirmDeactivation() {
    if (!selectedAdmin) return
    await deactivateAdmin.mutateAsync(selectedAdmin.id)
    setSelectedAdmin(null)
    closeMenu()
  }

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <DashboardHeaderActionButton
              startIcon={<AddRoundedIcon />}
              onClick={() => setIsCreateDialogOpen(true)}
            >
              {t('newAdmin')}
            </DashboardHeaderActionButton>
          }
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
          <TextField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t('searchPlaceholder')}
            size="small"
            sx={searchSx}
            slotProps={{
              htmlInput: { 'aria-label': t('searchPlaceholder') },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status)
              setPage(1)
            }}
            inputProps={{ 'aria-label': t('statusFilter') }}
            sx={filterSx}
          >
            <MenuItem value="all">{t('allStatuses')}</MenuItem>
            <MenuItem value="active">{t('active')}</MenuItem>
            <MenuItem value="inactive">{t('inactive')}</MenuItem>
          </Select>
          <Select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as typeof role)
              setPage(1)
            }}
            inputProps={{ 'aria-label': t('roleFilter') }}
            sx={filterSx}
          >
            <MenuItem value="all">{t('allRoles')}</MenuItem>
            <MenuItem value="ADMIN">{t('roles.ADMIN')}</MenuItem>
            <MenuItem value="ADMIN_AGENT">{t('roles.ADMIN_AGENT')}</MenuItem>
            <MenuItem value="AGENT">{t('roles.AGENT')}</MenuItem>
          </Select>
        </Stack>

        {adminsQuery.isLoading ? (
          <AdminsLoading />
        ) : adminsQuery.isError ? (
          <Alert severity="error">{t('loadError')}</Alert>
        ) : admins.length === 0 ? (
          <AdminsEmptyState
            icon={<PersonOutlineRoundedIcon />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            actionLabel={t('newAdmin')}
            onAction={() => setIsCreateDialogOpen(true)}
          />
        ) : filteredAdmins.length === 0 ? (
          <AdminsEmptyState
            icon={<SearchOffRoundedIcon />}
            title={t('noResultsTitle')}
            description={t('noResultsDescription')}
            actionLabel={t('clearFilters')}
            onAction={resetFilters}
          />
        ) : (
          <Paper variant="outlined" sx={tablePanelSx}>
            <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
              <Table sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('columns.admin')}</TableCell>
                    <TableCell>{t('columns.email')}</TableCell>
                    <TableCell>{t('columns.role')}</TableCell>
                    <TableCell>{t('columns.status')}</TableCell>
                    <TableCell>{t('columns.lastAccess')}</TableCell>
                    <TableCell>{t('columns.createdAt')}</TableCell>
                    <TableCell align="right">{t('columns.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageAdmins.map((admin) => (
                    <AdminRow key={admin.id} admin={admin} t={t} onMenuOpen={openMenu} />
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Stack sx={{ display: { xs: 'flex', md: 'none' } }}>
              {pageAdmins.map((admin) => (
                <AdminMobileCard key={admin.id} admin={admin} t={t} onMenuOpen={openMenu} />
              ))}
            </Stack>
            <DashboardTablePagination
              count={filteredAdmins.length}
              page={currentPage}
              rowsPerPage={defaultPageSize}
              rowsPerPageOptions={[defaultPageSize]}
              onPageChange={setPage}
            />
          </Paper>
        )}
      </Stack>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          closeMenu()
          setSelectedAdmin(null)
        }}
      >
        {selectedAdmin ? (
          <MenuItem
            onClick={() => {
              setEditingAdmin(selectedAdmin)
              closeMenu()
              setSelectedAdmin(null)
            }}
          >
            {t('editRegistration')}
          </MenuItem>
        ) : null}
        {selectedAdmin?.ativo ? (
          <MenuItem
            onClick={() => {
              requestDeactivation()
            }}
          >
            {t('deactivate')}
          </MenuItem>
        ) : selectedAdmin ? (
          <MenuItem onClick={requestActivation} disabled={activateAdmin.isPending}>
            {t('activate')}
          </MenuItem>
        ) : null}
      </Menu>

      <Dialog open={Boolean(selectedAdmin && !menuAnchor)} onClose={() => setSelectedAdmin(null)}>
        <DialogTitle>{t('deactivateTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedAdmin ? t('deactivateDescription', { name: selectedAdmin.nome }) : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAdmin(null)}>{t('cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeactivation}
            disabled={deactivateAdmin.isPending}
          >
            {t('deactivate')}
          </Button>
        </DialogActions>
      </Dialog>
      <CreatePlatformAdminDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
      <EditPlatformAdminDialog admin={editingAdmin} onClose={() => setEditingAdmin(null)} />
    </Box>
  )
}

function AdminRow({ admin, t, onMenuOpen }: AdminItemProps) {
  return (
    <TableRow hover>
      <TableCell>
        <AdminIdentity admin={admin} />
      </TableCell>
      <TableCell sx={cellSx}>{admin.email}</TableCell>
      <TableCell>
        <RoleBadge label={t(`roles.${admin.role}`)} />
      </TableCell>
      <TableCell>
        <StatusBadge active={admin.ativo} label={admin.ativo ? t('active') : t('inactive')} />
      </TableCell>
      <TableCell sx={cellSx}>{t('unavailable')}</TableCell>
      <TableCell sx={cellSx}>{t('unavailable')}</TableCell>
      <TableCell align="right">
        <IconButton
          aria-label={t('actionsFor', { name: admin.nome })}
          onClick={(event) => onMenuOpen(event.currentTarget, admin)}
        >
          <MoreHorizRoundedIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}

function AdminMobileCard({ admin, t, onMenuOpen }: AdminItemProps) {
  return (
    <Stack
      spacing={1.25}
      sx={{ px: 2, py: 1.75, borderBottom: '1px solid', borderColor: alpha.graphite[6] }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <AdminIdentity admin={admin} />
        <IconButton
          aria-label={t('actionsFor', { name: admin.nome })}
          onClick={(event) => onMenuOpen(event.currentTarget, admin)}
        >
          <MoreHorizRoundedIcon />
        </IconButton>
      </Stack>
      <Typography sx={cellSx}>{admin.email}</Typography>
      <Stack direction="row" spacing={1}>
        <RoleBadge label={t(`roles.${admin.role}`)} />
        <StatusBadge active={admin.ativo} label={admin.ativo ? t('active') : t('inactive')} />
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={labelSx}>{t('columns.lastAccess')}</Typography>
        <Typography sx={cellSx}>{t('unavailable')}</Typography>
      </Stack>
    </Stack>
  )
}

function AdminIdentity({ admin }: { admin: PlatformAdminAccount }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
      <Avatar
        sx={{ width: 32, height: 32, bgcolor: brand.magenta[500], fontSize: 12, fontWeight: 800 }}
      >
        {initials(admin.nome)}
      </Avatar>
      <Typography noWrap sx={{ color: brand.graphite[500], fontSize: 13, fontWeight: 800 }}>
        {admin.nome}
      </Typography>
    </Stack>
  )
}

function RoleBadge({ label }: { label: string }) {
  return (
    <Box component="span" sx={roleBadgeSx}>
      {label}
    </Box>
  )
}
function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <Stack
      component="span"
      direction="row"
      alignItems="center"
      spacing={0.65}
      sx={{ ...statusBadgeSx, ...(active ? activeSx : inactiveSx) }}
    >
      <Box
        component="span"
        sx={{ width: 6, height: 6, borderRadius: radius.full, bgcolor: 'currentColor' }}
      />
      {label}
    </Stack>
  )
}
function AdminsLoading() {
  return (
    <Paper variant="outlined" sx={tablePanelSx}>
      <Stack spacing={1.5} sx={{ p: 2.2 }}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} variant="rounded" height={44} />
        ))}
      </Stack>
    </Paper>
  )
}
function AdminsEmptyState({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel: string
  description: string
  icon: ReactNode
  onAction?: () => void
  title: string
}) {
  return (
    <Paper variant="outlined" sx={{ ...tablePanelSx, py: 7, textAlign: 'center' }}>
      <Stack alignItems="center" spacing={1.25}>
        <Box sx={{ color: brand.neutral[400], '& svg': { fontSize: 32 } }}>{icon}</Box>
        <Typography sx={{ color: brand.graphite[500], fontSize: 16, fontWeight: 800 }}>
          {title}
        </Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: 13, maxWidth: 420 }}>
          {description}
        </Typography>
        {onAction ? (
          <DashboardHeaderActionButton startIcon={<AddRoundedIcon />} onClick={onAction}>
            {actionLabel}
          </DashboardHeaderActionButton>
        ) : null}
      </Stack>
    </Paper>
  )
}

type AdminItemProps = {
  admin: PlatformAdminAccount
  t: ReturnType<typeof useTranslations>
  onMenuOpen: (anchor: HTMLElement, admin: PlatformAdminAccount) => void
}
const searchSx = {
  flex: 1,
  maxWidth: { md: 360 },
  '& .MuiInputBase-root': {
    height: { xs: 40, sm: 32 },
    borderRadius: `${radius.sm}px`,
    bgcolor: surface.paper,
    fontSize: 12,
  },
}
const filterSx = {
  minWidth: { xs: '100%', md: 170 },
  height: { xs: 40, sm: 32 },
  borderRadius: `${radius.sm}px`,
  bgcolor: surface.paper,
  fontSize: 12,
}
const tablePanelSx = {
  overflow: 'hidden',
  borderColor: alpha.graphite[6],
  borderRadius: `${radius.sm}px`,
  boxShadow: shadows.propertyCard,
  bgcolor: surface.paper,
  '& .MuiTableCell-head': {
    bgcolor: brand.neutral[50],
    color: brand.neutral[500],
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase',
  },
  '& .MuiTableCell-body': { borderColor: alpha.graphite[6], py: 1.25 },
}
const cellSx = { color: brand.neutral[500], fontSize: 12.5 }
const labelSx = { color: brand.neutral[500], fontSize: 11, fontWeight: 800 }
const roleBadgeSx = {
  display: 'inline-flex',
  borderRadius: `${radius.full}px`,
  bgcolor: alpha.magenta[6],
  color: brand.magenta[600],
  fontSize: 11,
  fontWeight: 800,
  px: 1,
  py: 0.45,
}
const statusBadgeSx = {
  display: 'inline-flex',
  borderRadius: `${radius.full}px`,
  fontSize: 11,
  fontWeight: 800,
  px: 1,
  py: 0.45,
}
const activeSx = { bgcolor: '#E7F7EE', color: brand.semantic.success }
const inactiveSx = { bgcolor: brand.neutral[100], color: brand.neutral[500] }
function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
