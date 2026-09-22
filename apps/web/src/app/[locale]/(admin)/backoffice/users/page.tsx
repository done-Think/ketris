import { getTranslations } from 'next-intl/server'
import { Container, Stack } from '@mui/material'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { UsersList } from '@modules/auth'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

  return { title: t('usersMetadataTitle') }
}

export default async function BackofficeUsersPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <UsersList />
      </Stack>
    </Container>
  )
}
