import { getTranslations } from 'next-intl/server'
import { Container, Stack } from '@mui/material'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ActionTextLink } from '@shared/components/ui'
import { AdminsList } from '@modules/auth'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

  return { title: t('adminsMetadataTitle') }
}

export default async function BackofficeAdminsPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

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
