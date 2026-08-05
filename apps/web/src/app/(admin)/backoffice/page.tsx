import { getServerSession } from 'next-auth'
import { Container, Stack, Typography } from '@mui/material'

import { authOptions } from '@shared/lib/auth/auth-options'
import { ActionTextLink } from '@shared/components/ui'

export const metadata = { title: 'Backoffice — Ketris' }

export default async function BackofficePage() {
  const session = await getServerSession(authOptions)

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2}>
        <Typography variant="h4">Olá, {session?.user?.name}</Typography>
        <Typography color="text.secondary">
          Você está autenticado como administrador deste tenant.
        </Typography>
        <ActionTextLink href="/backoffice/admins">Ver administradores</ActionTextLink>
      </Stack>
    </Container>
  )
}
