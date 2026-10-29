'use client'

import { Box, Typography } from '@mui/material'

import { Link } from '@/i18n/navigation'

import { getMiniPropertyImageStyles, styles } from '../styles/mini-property-card.styles'
import type { MiniPropertyCardProps } from '../types/mini-property'

export function MiniPropertyCard({ property }: MiniPropertyCardProps) {
  return (
    <Box
      component={Link}
      href={{ pathname: '/properties/[id]', params: { id: property.id } }}
      sx={styles.card}
    >
      <Box sx={getMiniPropertyImageStyles(property.image)} />
      <Box sx={styles.body}>
        <Typography sx={styles.title}>{property.title}</Typography>
        <Typography sx={styles.location}>{property.location}</Typography>
      </Box>
    </Box>
  )
}
