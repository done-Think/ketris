import { getTranslations } from 'next-intl/server'
import { Container, Stack } from '@mui/material'

import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { CreatePlatformAdminForm } from '@modules/platform'
import { SectionHeader } from '@shared/components/ui'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.newAdmin', locale)
}

export default async function PlatformNewAdminPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'platform.newAdmin' })

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 4, lg: 5 }, py: { xs: 3, md: 4 } }}>
      <Stack spacing={3} sx={{ maxWidth: 480 }}>
        <SectionHeader title={t('title')} />
        <CreatePlatformAdminForm />
      </Stack>
    </Container>
  )
}
