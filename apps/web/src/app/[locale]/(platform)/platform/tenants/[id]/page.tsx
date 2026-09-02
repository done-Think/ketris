import { getTranslations } from 'next-intl/server'
import { Divider, Stack, Typography } from '@mui/material'

import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { CreateTenantAdminForm, PlatformPageLayout, TenantUsersList } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.tenant', locale)
}

export default async function PlatformTenantPage({ params }: LocaleRoutePageProps<{ id: string }>) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'platform.tenant' })

  return (
    <PlatformPageLayout title={t('usersTitle')}>
      <Stack spacing={4}>
        <TenantUsersList tenantId={id} />

        <Divider />

        <Stack spacing={2}>
          <Typography variant="h6">{t('newAdmin')}</Typography>
          <CreateTenantAdminForm tenantId={id} />
        </Stack>
      </Stack>
    </PlatformPageLayout>
  )
}
