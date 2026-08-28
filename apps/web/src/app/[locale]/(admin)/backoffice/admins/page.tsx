import { getTranslations } from 'next-intl/server'
import { Container, Stack } from '@mui/material'

import { ActionTextLink } from '@shared/components/ui'
import { AdminsList } from '@modules/auth'

export async function generateMetadata() {
  const t = await getTranslations('auth.backoffice')

  return { title: t('adminsMetadataTitle') }
}

export default async function BackofficeAdminsPage() {
  const t = await getTranslations('auth.backoffice')

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="flex-end">
          <ActionTextLink href="/backoffice/admins/new">{t('inviteAdmin')}</ActionTextLink>
        </Stack>
        <AdminsList />
      </Stack>
    </Container>
  )
}
