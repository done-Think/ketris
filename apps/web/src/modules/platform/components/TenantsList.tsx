'use client'

import {
  Card,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import NextLink from 'next/link'

import { radius, shadows } from '@shared/theme/tokens'

import { useTenants } from '../hooks/use-tenants'

export function TenantsList() {
  const { data: tenants, isLoading, isError } = useTenants()

  return (
    <Card sx={{ borderRadius: `${radius.lg}px`, boxShadow: shadows.popover }}>
      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">Não foi possível carregar as imobiliárias.</Typography>
        </Stack>
      ) : tenants && tenants.length > 0 ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Criada em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow
                key={tenant.id}
                hover
                component={NextLink}
                href={`/platform/tenants/${tenant.id}`}
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <TableCell>{tenant.nome}</TableCell>
                <TableCell>{tenant.slug}</TableCell>
                <TableCell>{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Stack sx={{ py: 6 }} alignItems="center">
          <Typography color="text.secondary">Nenhuma imobiliária cadastrada ainda.</Typography>
        </Stack>
      )}
    </Card>
  )
}
