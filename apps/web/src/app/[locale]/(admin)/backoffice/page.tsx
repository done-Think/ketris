import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { Container, Stack, Typography } from '@mui/material'

import { createLocalizedMetadata } from '@/i18n/metadata'
import { authOptions } from '@shared/lib/auth/auth-options'
import { ActionTextLink } from '@shared/components/ui'

export const generateMetadata = () => createLocalizedMetadata('auth.backoffice')

export default async function BackofficePage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('auth.backoffice')

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2}>
        <Typography variant="h4">
          {t('welcome', { name: session?.user?.name ?? 'Ketris' })}
        </Typography>
        <Typography color="text.secondary">{t('authenticatedDescription')}</Typography>
        <ActionTextLink href="/backoffice/admins">{t('viewAdmins')}</ActionTextLink>
      </Stack>
    </Container>
  )
}
