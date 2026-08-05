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
import NextLink from 'next/link'

import { radius, shadows } from '@shared/theme/tokens'

import { useAdmins } from '../hooks/use-admins'
import { useDeactivateAdmin } from '../hooks/use-deactivate-admin'

const GENERIC_ERROR = 'Não foi possível desativar o administrador. Tente novamente.'

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }
  return GENERIC_ERROR
}

export function AdminsList() {
  const { data: session } = useSession()
  const { data: admins, isLoading, isError } = useAdmins()
  const deactivateAdmin = useDeactivateAdmin()
  const { enqueueSnackbar } = useSnackbar()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleDeactivate(id: string) {
    setPendingId(id)
    try {
      await deactivateAdmin.mutateAsync(id)
      enqueueSnackbar('Administrador desativado.', { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error), { variant: 'error' })
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
          <Typography color="text.secondary">
            Não foi possível carregar os administradores.
          </Typography>
        </Stack>
      ) : admins && admins.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => {
              const isSelf = admin.id === session?.user?.id

              return (
                <TableRow key={admin.id}>
                  <TableCell>
                    <NextLink href={`/backoffice/admins/${admin.id}`}>{admin.nome}</NextLink>
                  </TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={admin.ativo ? 'Ativo' : 'Inativo'}
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
                      Desativar
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">Nenhum administrador cadastrado ainda.</Typography>
        </Stack>
      )}
    </Card>
  )
}
