import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import { Box, Stack, Typography } from '@mui/material'

import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { MetricCardProps } from '../types/maintenance'

export function MetricCard({ label, value, tone }: MetricCardProps) {
  const config =
    tone === 'open'
      ? { Icon: FolderOpenOutlinedIcon, bg: '#E5F3FF', color: '#2877E8' }
      : tone === 'urgent'
        ? { Icon: WarningAmberRoundedIcon, bg: '#FDEBEC', color: brand.semantic.error }
        : { Icon: AccessTimeOutlinedIcon, bg: '#FFF5D8', color: '#D98900' }
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={{ xs: 0.5, sm: 1.3 }}
      sx={{
        minWidth: 0,
        minHeight: { xs: 84, sm: 78 },
        overflow: 'hidden',
        px: { xs: 1.2, sm: 2.1 },
        py: { xs: 1.3, sm: 1.5 },
        bgcolor: surface.paper,
        borderRadius: `${radius.sm}px`,
        boxShadow: shadows.crmCardCompact,
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          display: { xs: 'none', sm: 'grid' },
          placeItems: 'center',
          bgcolor: config.bg,
          color: config.color,
        }}
      >
        <config.Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
        <Typography
          noWrap
          sx={{
            width: '100%',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: brand.neutral[500],
            fontSize: { xs: 10, sm: 12 },
            fontWeight: 900,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            color: brand.graphite[500],
            fontSize: { xs: 24, sm: 30 },
            lineHeight: 1.1,
            fontWeight: 900,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}
