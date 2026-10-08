import { Box, Stack, Typography } from '@mui/material'

import { brand } from '@shared/theme/tokens'
import type { DashboardPageHeaderProps } from '@shared/types/dashboard-page-header'

export function DashboardPageHeader({ actions, subtitle, sx, title }: DashboardPageHeaderProps) {
  return (
    <Stack
      component="header"
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'flex-start' }}
      justifyContent="space-between"
      spacing={1.6}
      sx={[
        { pb: 1.75, borderBottom: '1px solid', borderColor: 'divider' },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          component="h1"
          sx={{
            color: brand.graphite[500],
            fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
            fontSize: { xs: 26, sm: 30 },
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ color: brand.neutral[500], fontSize: { xs: 13, sm: 14 } }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      {actions ? (
        <Box sx={{ flexShrink: 0, width: { xs: '100%', md: 'auto' } }}>{actions}</Box>
      ) : null}
    </Stack>
  )
}
