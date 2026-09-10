import { getTranslations } from 'next-intl/server'
import { Stack } from '@mui/material'

import { createLocalizedMetadata } from '@/i18n/metadata'
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'
import { ActionTextLink } from '@shared/components/ui'
import { PlatformPageLayout, TenantsList } from '@modules/platform'

export const generateMetadata = async ({ params }: LocaleRoutePageProps) => {
  const { locale } = await params

  return createLocalizedMetadata('platform.metadata.dashboard', locale)
}

export default async function PlatformDashboardPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'platform.dashboard' })

  return (
    <PlatformPageLayout
      title={t('title')}
      action={
        <Stack direction="row" spacing={2}>
          <ActionTextLink href="/platform/admins/new">{t('platformAdmins')}</ActionTextLink>
          <ActionTextLink href="/platform/tenants/new">{t('newTenant')}</ActionTextLink>
        </Stack>
      }
    >
      <TenantsList />
    </PlatformPageLayout>
  )
}
