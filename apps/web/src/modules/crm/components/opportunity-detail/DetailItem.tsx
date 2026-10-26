import { Box, Typography } from '@mui/material'
import * as crmStyles from '../../styles/detail-item.styles'

import type { DetailItemProps } from '../../types/opportunity-detail'

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <Box>
      <Typography sx={crmStyles.typographySx}>{label}</Typography>
      <Typography sx={crmStyles.typographySx2}>{value}</Typography>
    </Box>
  )
}
