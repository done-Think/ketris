import { getTranslations } from 'next-intl/server'
import { Divider, Stack, Typography } from '@mui/material'

import { createLocalizedMetadata } from '@/i18n/metadata'
import { CreateTenantAdminForm, PlatformPageLayout, TenantUsersList } from '@modules/platform'

export const generateMetadata = () => createLocalizedMetadata('platform.metadata.tenant')

interface PlatformTenantPageProps {
  params: { id: string }
}

export default async function PlatformTenantPage({ params }: PlatformTenantPageProps) {
  const t = await getTranslations('platform.tenant')

  return (
    <PlatformPageLayout title={t('usersTitle')}>
      <Stack spacing={4}>
        <TenantUsersList tenantId={params.id} />

        <Divider />

        <Stack spacing={2}>
          <Typography variant="h6">{t('newAdmin')}</Typography>
          <CreateTenantAdminForm tenantId={params.id} />
        </Stack>
      </Stack>
    </PlatformPageLayout>
  )
}
