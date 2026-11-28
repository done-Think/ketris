'use client'

import { Box, Button, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { useToggleFavoriteProperty } from '../../hooks/use-favorite-properties'
import type { UnavailableFavoritesProps } from '../../types/favorite-property'
import { getBoxStyles } from '../../styles/search-results-list.styles'
import { styles } from '../../styles/favorites-page.styles'

export function UnavailableFavorites({ entries, viewMode }: UnavailableFavoritesProps) {
  const t = useTranslations('marketplace.favorites.page.unavailable')
  const { mutate, isPending } = useToggleFavoriteProperty()

  return (
    <Box component="section" sx={styles.unavailableSection}>
      <Typography variant="h6" component="h2" sx={styles.unavailableHeading}>
        {t('title')}
      </Typography>
      <Box sx={getBoxStyles({ viewMode })}>
        {entries.map(({ propertyId, property }) => (
          <Box key={propertyId} component="article" sx={styles.unavailableCard}>
            <Typography sx={styles.unavailableLocation}>
              {[property.neighborhood, property.city].filter(Boolean).join(', ')}
            </Typography>
            <Typography sx={styles.unavailableTitle}>{property.title}</Typography>
            <Typography sx={styles.unavailableNote}>{t('note')}</Typography>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              disabled={isPending}
              onClick={() => mutate({ propertyId, favorite: false })}
              sx={styles.unavailableAction}
            >
              {t('remove')}
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
