'use client'

import { styles } from '../../styles/contract-detail-panel.styles'
import { Box, Typography } from '@mui/material'
import type { ContractDetailPanelProps } from '../../types/detail'

export function ContractDetailPanel({ title, children, sx }: ContractDetailPanelProps) {
  return (
    <Box sx={styles.box(sx)}>
      <Typography sx={styles.typography}>{title}</Typography>
      {children}
    </Box>
  )
}
