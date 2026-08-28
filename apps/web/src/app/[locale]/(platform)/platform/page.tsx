import { getTranslations } from 'next-intl/server'
import { Stack } from '@mui/material'

import { createLocalizedMetadata } from '@/i18n/metadata'
import { ActionTextLink } from '@shared/components/ui'
import { PlatformPageLayout, TenantsList } from '@modules/platform'

export const generateMetadata = () => createLocalizedMetadata('platform.metadata.dashboard')

export default async function PlatformDashboardPage() {
  const t = await getTranslations('platform.dashboard')

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
