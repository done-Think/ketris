'use client'

import {
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

import { radius, shadows } from '@shared/theme/tokens'

import { useTenantUsers } from '../hooks/use-tenant-users'

type TenantUsersListProps = {
  tenantId: string
}

export function TenantUsersList({ tenantId }: TenantUsersListProps) {
  const { data: users, isLoading, isError } = useTenantUsers(tenantId)

  return (
    <Card sx={{ borderRadius: `${radius.lg}px`, boxShadow: shadows.popover }}>
      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">Não foi possível carregar os usuários.</Typography>
        </Stack>
      ) : users && users.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>E-mail</TableCell>
              <TableCell>Papel</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.nome}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.papel}</TableCell>
                <TableCell>
                  <Chip
                    label={user.ativo ? 'Ativo' : 'Inativo'}
                    color={user.ativo ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">Nenhum usuário cadastrado ainda.</Typography>
        </Stack>
      )}
    </Card>
  )
}
