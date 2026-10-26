import { Box, Typography } from '@mui/material'

import { styles } from '../styles/lead-briefing-item.styles'
import type { LeadBriefingItemProps } from '../types/dashboard-overview'

export function LeadBriefingItem({ label, value }: LeadBriefingItemProps) {
  return (
    <Box sx={styles.item}>
      <Typography sx={styles.label}>{label}</Typography>
      <Typography sx={styles.value}>{value}</Typography>
    </Box>
  )
}
