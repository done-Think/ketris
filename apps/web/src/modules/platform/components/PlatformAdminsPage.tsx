'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded'
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded'
import { Alert, Box, Menu, MenuItem, Paper, Stack } from '@mui/material'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import {
  DashboardHeaderActionButton,
  DashboardPageHeader,
  DashboardTablePagination,
} from '@shared/components/layout'
import { useListState } from '@shared/hooks/use-list-state'

import { emptyPlatformAdminsFilters, platformAdminsPageSize } from '../config/platform-admins'
import { useActivatePlatformAdmin, usePlatformAdmins } from '../hooks/use-platform-admins'
import { usePlatformActor } from '../hooks/use-platform-actor'
import { styles } from '../styles/platform-admins-page.styles'
import type {
  PlatformAdminAction,
  PlatformAdminMenuState,
  PlatformAdminsListState,
} from '../types/platform-admin'
import { filterPlatformAdmins } from '../utils/platform-admins'
import { CreatePlatformAdminDialog } from './CreatePlatformAdminDialog'
import { EditPlatformAdminDialog } from './EditPlatformAdminDialog'
import { DeactivatePlatformAdminDialog } from './platform-admins/DeactivatePlatformAdminDialog'
import { PlatformAdminsFilters } from './platform-admins/PlatformAdminsFilters'
import {
  PlatformAdminsEmptyState,
  PlatformAdminsLoading,
} from './platform-admins/PlatformAdminsStates'
import { PlatformAdminsTable } from './platform-admins/PlatformAdminsTable'

export function PlatformAdminsPage() {
  const t = useTranslations('platform.admins')
  const { enqueueSnackbar } = useSnackbar()
  const { canManage } = usePlatformActor()
  const adminsQuery = usePlatformAdmins()
  const activateAdmin = useActivatePlatformAdmin()
  const { filters, updateFilters } = useListState<PlatformAdminsListState>({
    ...emptyPlatformAdminsFilters,
  })
  const [menu, setMenu] = useState<PlatformAdminMenuState | null>(null)
  const [action, setAction] = useState<PlatformAdminAction | null>(null)

  const admins = adminsQuery.data ?? []
  const filteredAdmins = filterPlatformAdmins(admins, filters)
  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / platformAdminsPageSize))
  const currentPage = Math.min(filters.page, totalPages)
  const pageAdmins = filteredAdmins.slice(
    (currentPage - 1) * platformAdminsPageSize,
    currentPage * platformAdminsPageSize,
  )
  const openCreate = canManage ? () => setAction({ type: 'create' }) : undefined

  async function activate() {
    if (!menu) return
    const { admin } = menu
    setMenu(null)
    try {
      await activateAdmin.mutateAsync(admin.id)
      enqueueSnackbar(t('updateSuccess'), { variant: 'success' })
    } catch {
      enqueueSnackbar(t('updateError'), { variant: 'error' })
    }
  }

  return (
    <Box sx={styles.box}>
      <Stack spacing={2.4}>
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            openCreate ? (
              <DashboardHeaderActionButton startIcon={<AddRoundedIcon />} onClick={openCreate}>
                {t('newAdmin')}
              </DashboardHeaderActionButton>
            ) : undefined
          }
        />

        <PlatformAdminsFilters filters={filters} onChange={updateFilters} />

        {adminsQuery.isLoading ? (
          <PlatformAdminsLoading />
        ) : adminsQuery.isError ? (
          <Alert severity="error">{t('loadError')}</Alert>
        ) : admins.length === 0 ? (
          <PlatformAdminsEmptyState
            icon={<PersonOutlineRoundedIcon />}
            title={t('emptyTitle')}
            description={t('emptyDescription')}
            actionLabel={t('newAdmin')}
            onAction={openCreate}
          />
        ) : filteredAdmins.length === 0 ? (
          <PlatformAdminsEmptyState
            icon={<SearchOffRoundedIcon />}
            title={t('noResultsTitle')}
            description={t('noResultsDescription')}
            actionLabel={t('clearFilters')}
            onAction={() => updateFilters({ ...emptyPlatformAdminsFilters })}
          />
        ) : (
          <Paper variant="outlined" sx={styles.tablePanel}>
            <PlatformAdminsTable
              admins={pageAdmins}
              onMenuOpen={canManage ? (anchor, admin) => setMenu({ anchor, admin }) : undefined}
            />
            <DashboardTablePagination
              count={filteredAdmins.length}
              page={currentPage}
              rowsPerPage={platformAdminsPageSize}
              rowsPerPageOptions={[platformAdminsPageSize]}
              onPageChange={(page) => updateFilters({ page })}
            />
          </Paper>
        )}
      </Stack>

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            if (menu) setAction({ type: 'edit', admin: menu.admin })
            setMenu(null)
          }}
        >
          {t('editRegistration')}
        </MenuItem>
        {menu?.admin.active ? (
          <MenuItem
            onClick={() => {
              setAction({ type: 'deactivate', admin: menu.admin })
              setMenu(null)
            }}
          >
            {t('deactivate')}
          </MenuItem>
        ) : (
          <MenuItem onClick={activate} disabled={activateAdmin.isPending}>
            {t('activate')}
          </MenuItem>
        )}
      </Menu>

      <CreatePlatformAdminDialog open={action?.type === 'create'} onClose={() => setAction(null)} />
      {action?.type === 'edit' ? (
        <EditPlatformAdminDialog admin={action.admin} onClose={() => setAction(null)} />
      ) : null}
      {action?.type === 'deactivate' ? (
        <DeactivatePlatformAdminDialog admin={action.admin} onClose={() => setAction(null)} />
      ) : null}
    </Box>
  )
}
