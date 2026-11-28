'use client'

import { Box } from '@mui/material'

import type { SearchPropertyCardProps } from '../../types/search'
import { SearchPropertyCard } from '../SearchPropertyCard'
import { getFavoriteSlotStyles, styles } from '../../styles/favorite-button.styles'
import { FavoriteButton } from './FavoriteButton'

export function FavoritablePropertyCard(props: SearchPropertyCardProps) {
  return (
    <Box sx={styles.cardWrapper}>
      <SearchPropertyCard {...props} />
      <Box data-favorite-slot sx={getFavoriteSlotStyles({ isListView: props.viewMode === 'list' })}>
        <FavoriteButton propertyId={props.property.id} variant="card" />
      </Box>
    </Box>
  )
}
