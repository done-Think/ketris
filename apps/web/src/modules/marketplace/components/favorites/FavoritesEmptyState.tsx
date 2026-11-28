'use client'

import { Box, Button, Stack, Typography } from '@mui/material'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'

import type { FavoritesEmptyStateProps } from '../../types/favorite-property'
import { styles as favoriteStyles } from '../../styles/favorite-button.styles'
import { styles } from '../../styles/favorites-page.styles'

export function FavoritesEmptyState({ variant }: FavoritesEmptyStateProps) {
  const t = useTranslations(`marketplace.favorites.page.${variant}`)
  const router = useRouter()

  return (
    <Box sx={styles.empty}>
      <Box sx={favoriteStyles.favoriteIcon}>
        <FavoriteBorderOutlinedIcon fontSize="large" />
      </Box>
      <Typography variant="h5" component="h2">
        {t('title')}
      </Typography>
      <Typography sx={styles.emptyText}>{t('description')}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        {variant === 'guest' ? (
          <Button
            variant="contained"
            onClick={() =>
              router.push({ pathname: '/login', query: { callbackUrl: '/favorites' } })
            }
          >
            {t('action')}
          </Button>
        ) : null}
        {variant === 'empty' ? (
          <>
            <Button
              variant="contained"
              onClick={() => router.push({ pathname: '/properties', query: { purpose: 'rent' } })}
            >
              {t('rentAction')}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => router.push({ pathname: '/properties', query: { purpose: 'buy' } })}
            >
              {t('buyAction')}
            </Button>
          </>
        ) : null}
      </Stack>
    </Box>
  )
}
