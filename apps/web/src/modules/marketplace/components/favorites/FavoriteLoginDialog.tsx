'use client'

import { Box, Button, Dialog, DialogContent, Stack, Typography } from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import { useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'

import type { FavoriteLoginDialogProps } from '../../types/favorite-property'
import { buildFavoriteLoginCallback } from '../../utils/favorite-login'
import { styles } from '../../styles/favorite-button.styles'

export function FavoriteLoginDialog({ propertyId, onClose }: FavoriteLoginDialogProps) {
  const t = useTranslations('marketplace.favorites.login')
  const router = useRouter()
  const callbackUrl = buildFavoriteLoginCallback(window.location.href, propertyId)

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="favorite-login-title"
      slotProps={{ paper: { sx: styles.loginPaper } }}
    >
      <DialogContent sx={styles.loginContent}>
        <Box sx={styles.favoriteIcon}>
          <FavoriteIcon fontSize="large" />
        </Box>
        <Typography id="favorite-login-title" variant="h5" component="h2">
          {t('title')}
        </Typography>
        <Typography color="text.secondary">{t('description')}</Typography>
        <Stack spacing={1} sx={styles.loginActions}>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push({ pathname: '/login', query: { callbackUrl } })}
          >
            {t('signIn')}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            component={Link}
            href="/register"
          >
            {t('signUp')}
          </Button>
          <Button color="secondary" onClick={onClose}>
            {t('notNow')}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
