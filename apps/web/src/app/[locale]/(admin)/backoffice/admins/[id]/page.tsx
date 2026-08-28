import { getTranslations } from 'next-intl/server'
import { Container, Stack, Typography } from '@mui/material'

import { EditAdminForm } from '@modules/auth'

export async function generateMetadata() {
  const t = await getTranslations('auth.backoffice')

  return { title: t('editAdminMetadataTitle') }
}

interface BackofficeEditAdminPageProps {
  params: { id: string }
}

export default async function BackofficeEditAdminPage({ params }: BackofficeEditAdminPageProps) {
  const t = await getTranslations('auth.backoffice')

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h5">{t('editAdminTitle')}</Typography>
        <EditAdminForm adminId={params.id} />
      </Stack>
    </Container>
  )
}
