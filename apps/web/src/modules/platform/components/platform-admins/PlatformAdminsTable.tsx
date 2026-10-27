'use client'

import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import {
  Avatar,
  Box,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useFormatter, useTranslations } from 'next-intl'

import { getStackStyles, styles } from '../../styles/platform-admins-page.styles'
import type {
  AdminItemProps,
  PlatformAdminAccount,
  PlatformAdminsTableProps,
} from '../../types/platform-admin'
import { adminInitials } from '../../utils/platform-admins'

export function PlatformAdminsTable({ admins, onMenuOpen }: PlatformAdminsTableProps) {
  const t = useTranslations('platform.admins')

  return (
    <>
      <Box sx={styles.box2}>
        <Table sx={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell>{t('columns.admin')}</TableCell>
              <TableCell>{t('columns.email')}</TableCell>
              <TableCell>{t('columns.role')}</TableCell>
              <TableCell>{t('columns.status')}</TableCell>
              <TableCell>{t('columns.lastAccess')}</TableCell>
              <TableCell>{t('columns.createdAt')}</TableCell>
              {onMenuOpen ? <TableCell align="right">{t('columns.actions')}</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => (
              <AdminRow key={admin.id} admin={admin} onMenuOpen={onMenuOpen} />
            ))}
          </TableBody>
        </Table>
      </Box>
      <Stack sx={styles.stack}>
        {admins.map((admin) => (
          <AdminMobileCard key={admin.id} admin={admin} onMenuOpen={onMenuOpen} />
        ))}
      </Stack>
    </>
  )
}

function useAdminDates(admin: PlatformAdminAccount) {
  const t = useTranslations('platform.admins')
  const format = useFormatter()

  return {
    createdAt: format.dateTime(new Date(admin.createdAt), { dateStyle: 'short' }),
    lastAccess: admin.lastAccessAt
      ? format.dateTime(new Date(admin.lastAccessAt), { dateStyle: 'short', timeStyle: 'short' })
      : t('neverAccessed'),
  }
}

function AdminActionsButton({ admin, onMenuOpen }: AdminItemProps) {
  const t = useTranslations('platform.admins')
  if (!onMenuOpen) return null

  return (
    <IconButton
      aria-label={t('actionsFor', { name: admin.name })}
      onClick={(event) => onMenuOpen(event.currentTarget, admin)}
    >
      <MoreHorizRoundedIcon />
    </IconButton>
  )
}

function AdminRow({ admin, onMenuOpen }: AdminItemProps) {
  const t = useTranslations('platform.admins')
  const dates = useAdminDates(admin)

  return (
    <TableRow hover>
      <TableCell>
        <AdminIdentity admin={admin} />
      </TableCell>
      <TableCell sx={styles.cell}>{admin.email}</TableCell>
      <TableCell>
        <RoleBadge label={t(`roles.${admin.role}`)} />
      </TableCell>
      <TableCell>
        <StatusBadge active={admin.active} label={admin.active ? t('active') : t('inactive')} />
      </TableCell>
      <TableCell sx={styles.cell}>{dates.lastAccess}</TableCell>
      <TableCell sx={styles.cell}>{dates.createdAt}</TableCell>
      {onMenuOpen ? (
        <TableCell align="right">
          <AdminActionsButton admin={admin} onMenuOpen={onMenuOpen} />
        </TableCell>
      ) : null}
    </TableRow>
  )
}

function AdminMobileCard({ admin, onMenuOpen }: AdminItemProps) {
  const t = useTranslations('platform.admins')
  const dates = useAdminDates(admin)

  return (
    <Stack spacing={1.25} sx={styles.stack2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <AdminIdentity admin={admin} />
        <AdminActionsButton admin={admin} onMenuOpen={onMenuOpen} />
      </Stack>
      <Typography sx={styles.cell}>{admin.email}</Typography>
      <Stack direction="row" spacing={1}>
        <RoleBadge label={t(`roles.${admin.role}`)} />
        <StatusBadge active={admin.active} label={admin.active ? t('active') : t('inactive')} />
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={styles.label}>{t('columns.lastAccess')}</Typography>
        <Typography sx={styles.cell}>{dates.lastAccess}</Typography>
      </Stack>
    </Stack>
  )
}

function AdminIdentity({ admin }: { admin: PlatformAdminAccount }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.2} sx={styles.stack3}>
      <Avatar sx={styles.avatar}>{adminInitials(admin.name)}</Avatar>
      <Typography noWrap sx={styles.typography}>
        {admin.name}
      </Typography>
    </Stack>
  )
}

function RoleBadge({ label }: { label: string }) {
  return (
    <Box component="span" sx={styles.roleBadge}>
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
      sx={getStackStyles({ active })}
    >
      <Box component="span" sx={styles.box3} />
      {label}
    </Stack>
  )
}
