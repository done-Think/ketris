'use client'

import { useState } from 'react'
import {
  Button,
  Card,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import axios from 'axios'
import { useTranslations } from 'next-intl'

import { radius, shadows } from '@shared/theme/tokens'

import { useApproveUserMembership } from '../hooks/use-approve-user-membership'
import { useUsers } from '../hooks/use-users'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

export function UsersList() {
  const t = useTranslations('auth.backoffice')
  const { data: users, isLoading, isError } = useUsers()
  const approveMembership = useApproveUserMembership()
  const { enqueueSnackbar } = useSnackbar()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleApprove(id: string) {
    setPendingId(id)
    try {
      await approveMembership.mutateAsync(id)
      enqueueSnackbar(t('approveSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('approveGenericError')), { variant: 'error' })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Card sx={{ borderRadius: `${radius.lg}px`, boxShadow: shadows.popover }}>
      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('usersLoadError')}</Typography>
        </Stack>
      ) : users && users.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('fields.name')}</TableCell>
              <TableCell>{t('fields.email')}</TableCell>
              <TableCell>{t('fields.role')}</TableCell>
              <TableCell>{t('fields.status')}</TableCell>
              <TableCell align="right">{t('fields.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.pendingApproval ? (
                    <Chip label={t('statusPending')} color="warning" size="small" />
                  ) : (
                    <Chip
                      label={user.active ? t('statusActive') : t('statusInactive')}
                      color={user.active ? 'success' : 'default'}
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  {user.pendingApproval ? (
                    <Button
                      size="small"
                      color="primary"
                      disabled={pendingId === user.id}
                      onClick={() => handleApprove(user.id)}
                    >
                      {t('approve')}
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('emptyUsers')}</Typography>
        </Stack>
      )}
    </Card>
  )
}
