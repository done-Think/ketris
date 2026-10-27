import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Box, Stack, Typography } from '@mui/material'
import * as maintenanceStyles from '../styles/metric-card.styles'

import { brand, supportColor } from '@shared/theme/tokens'

import type { MetricCardProps } from '../types/maintenance'

export function MetricCard({ label, value, tone }: MetricCardProps) {
  const config =
    tone === 'open'
      ? { Icon: FolderOpenOutlinedIcon, bg: supportColor.infoSoft, color: brand.semantic.info }
      : tone === 'urgent'
        ? { Icon: WarningAmberRoundedIcon, bg: supportColor.errorSoft, color: brand.semantic.error }
        : {
            Icon: AccessTimeOutlinedIcon,
            bg: supportColor.warningSoft,
            color: brand.semantic.warning,
          }
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={{ xs: 0.5, sm: 1.3 }}
      sx={maintenanceStyles.stackSx}
    >
      <Box sx={maintenanceStyles.getBoxSx(config)}>
        <config.Icon sx={maintenanceStyles.configIconSx} />
      </Box>
      <Box sx={maintenanceStyles.boxSx}>
        <Typography noWrap sx={maintenanceStyles.typographySx}>
          {label}
        </Typography>
        <Typography sx={maintenanceStyles.typographySx2}>{value}</Typography>
      </Box>
    </Stack>
  )
}
