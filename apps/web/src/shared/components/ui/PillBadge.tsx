import { styles } from '@shared/styles/pill-badge.styles'
import { Box } from '@mui/material'

import type { PillBadgeProps } from '@shared/types/pill-badge'

export function PillBadge({ children }: PillBadgeProps) {
  return <Box sx={styles.box}>{children}</Box>
}
