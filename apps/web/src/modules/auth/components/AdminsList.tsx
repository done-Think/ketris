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
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { radius, shadows } from '@shared/theme/tokens'

import { useAdmins } from '../hooks/use-admins'
import { useDeactivateAdmin } from '../hooks/use-deactivate-admin'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return fallback
}

export function AdminsList() {
  const t = useTranslations('auth.backoffice')
  const { data: session } = useSession()
  const { data: admins, isLoading, isError } = useAdmins()
  const deactivateAdmin = useDeactivateAdmin()
  const { enqueueSnackbar } = useSnackbar()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleDeactivate(id: string) {
    setPendingId(id)
    try {
      await deactivateAdmin.mutateAsync(id)
      enqueueSnackbar(t('deactivateSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('deactivateGenericError')), {
        variant: 'error',
      })
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
          <Typography color="text.secondary">{t('adminsLoadError')}</Typography>
        </Stack>
      ) : admins && admins.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('fields.name')}</TableCell>
              <TableCell>{t('fields.email')}</TableCell>
              <TableCell>{t('fields.status')}</TableCell>
              <TableCell align="right">{t('fields.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => {
              const isSelf = admin.id === session?.user?.id

              return (
                <TableRow key={admin.id}>
                  <TableCell>
                    <Link href={{ pathname: '/backoffice/admins/[id]', params: { id: admin.id } }}>
                      {admin.nome}
                    </Link>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={admin.ativo ? t('statusActive') : t('statusInactive')}
                      color={admin.ativo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      color="error"
                      disabled={isSelf || !admin.ativo || pendingId === admin.id}
                      onClick={() => handleDeactivate(admin.id)}
                    >
                      {t('deactivate')}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">{t('emptyAdmins')}</Typography>
        </Stack>
      )}
    </Card>
  )
}
