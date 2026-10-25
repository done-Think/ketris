'use client'

import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useCurrentUser } from '../hooks/use-current-user'
import { styles } from '../styles/current-user-profile-page.styles'
import { CurrentUserPersonalDataForm } from './CurrentUserPersonalDataForm'
import { CurrentUserPasswordForm } from './CurrentUserPasswordForm'

export function CurrentUserProfilePage() {
  const t = useTranslations('common.profilePage')
  const profile = useCurrentUser()
  return (
    <Box sx={styles.box}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" sx={styles.typography}>
            {t('title')}
          </Typography>
          <Typography sx={styles.typography2}>{t('subtitle')}</Typography>
        </Box>
        {profile.isPending ? <CircularProgress aria-label={t('loading')} /> : null}
        {profile.isError ? (
          <Alert
            severity="error"
            action={<Button onClick={() => profile.refetch()}>{t('retry')}</Button>}
          >
            {t('loadError')}
          </Alert>
        ) : null}
        {profile.data ? (
          <>
            <CurrentUserPersonalDataForm
              key={`${profile.data.tenantId}/${profile.data.id}/${profile.data.role}`}
              user={profile.data}
            />
            <CurrentUserPasswordForm />
          </>
        ) : null}
      </Stack>
    </Box>
  )
}
