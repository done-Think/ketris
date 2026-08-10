import { Container, Stack } from '@mui/material'

import { ActionTextLink } from '@shared/components/ui'
import { AdminsList } from '@modules/auth'

export const metadata = { title: 'Administradores — Ketris Backoffice' }

export default function BackofficeAdminsPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="flex-end">
          <ActionTextLink href="/backoffice/admins/new">Convidar novo administrador</ActionTextLink>
        </Stack>
        <AdminsList />
      </Stack>
    </Container>
  )
}
