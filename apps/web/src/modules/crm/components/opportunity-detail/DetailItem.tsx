import { Box, Typography } from '@mui/material'

import type { DetailItemProps } from '../../types/opportunity-detail'
import { labelSx } from './opportunity-detail.styles'

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <Box>
      <Typography sx={labelSx}>{label}</Typography>
      <Typography sx={{ mt: 0.45, fontSize: 13.5, fontWeight: 600, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  )
}
