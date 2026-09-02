import { getTranslations } from 'next-intl/server'
import { Container, Stack, Typography } from '@mui/material'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { EditAdminForm } from '@modules/auth'

export async function generateMetadata({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

  return { title: t('editAdminMetadataTitle') }
}

export default async function BackofficeEditAdminPage({
  params,
}: LocaleRoutePageProps<{ id: string }>) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.backoffice' })

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h5">{t('editAdminTitle')}</Typography>
        <EditAdminForm adminId={id} />
      </Stack>
    </Container>
  )
}
