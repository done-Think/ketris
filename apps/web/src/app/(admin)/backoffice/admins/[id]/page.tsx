import { Container, Stack, Typography } from '@mui/material'

import { EditAdminForm } from '@modules/auth'

export const metadata = { title: 'Editar administrador — Ketris Backoffice' }

interface BackofficeEditAdminPageProps {
  params: { id: string }
}

export default function BackofficeEditAdminPage({ params }: BackofficeEditAdminPageProps) {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h5">Editar administrador</Typography>
        <EditAdminForm adminId={params.id} />
      </Stack>
    </Container>
  )
}
