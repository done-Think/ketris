import { Box, Divider, Typography } from '@mui/material'

import { styles } from '../styles/charge-details.styles'
import type { ChargeSectionCardProps } from '../types/charge'

export function ChargeSectionCard({ title, children }: ChargeSectionCardProps) {
  return (
    <Box sx={styles.card}>
      <Typography component="h2" sx={styles.cardTitle}>
        {title}
      </Typography>
      <Divider sx={styles.divider} />
      {children}
    </Box>
  )
}
