import { styles } from '@shared/styles/dashboard-page-header.styles'
import { Box, Stack, Typography } from '@mui/material'

import { dashboardLayout } from '@shared/theme/tokens'
import type { DashboardPageHeaderProps } from '@shared/types/dashboard-page-header'

export function DashboardPageHeader({ actions, subtitle, sx, title }: DashboardPageHeaderProps) {
  return (
    <Stack
      component="header"
      justifyContent="space-between"
      sx={[
        {
          pb: 1.75,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1.6,
          [dashboardLayout.desktopMediaQuery]: {
            flexDirection: 'row',
            alignItems: 'flex-start',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box sx={styles.box}>
        <Typography component="h1" sx={styles.typography}>
          {title}
        </Typography>
        {subtitle ? <Typography sx={styles.typography2}>{subtitle}</Typography> : null}
      </Box>

      {actions ? <Box sx={styles.box2}>{actions}</Box> : null}
    </Stack>
  )
}
