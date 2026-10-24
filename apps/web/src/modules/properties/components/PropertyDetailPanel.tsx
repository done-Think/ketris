import { styles } from '../styles/property-detail-panel.styles'
import { Box, Typography } from '@mui/material'

import type { PropertyDetailPanelProps } from '../types/dashboard-property'

export function PropertyDetailPanel({ title, children }: PropertyDetailPanelProps) {
  return (
    <Box sx={styles.box}>
      <Typography sx={styles.typography}>{title}</Typography>
      {children}
    </Box>
  )
}
