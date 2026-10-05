import { Box, Typography } from '@mui/material'

import type { DetailItemProps } from '../../types/opportunity-detail'
import { labelSx } from './opportunity-detail.styles'

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <Box>
      <Typography sx={{ ...labelSx, textAlign: 'center' }}>{label}</Typography>
      <Typography
        sx={{
          mt: 0.25,
          fontSize: 13,
          fontWeight: 600,
          overflowWrap: 'anywhere',
          textAlign: 'center',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}
