'use client'

import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined'
import { Box, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, radius, shadows, surface } from '@shared/theme/tokens'

// Infrastructure health (gateway, database, storage, traffic and logs) has no real data source
// yet: it needs a monitoring integration, so the page states that instead of showing samples.
export function PlatformSystemPage() {
  const t = useTranslations('platform.system')

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Typography
        component="h1"
        sx={{
          color: brand.graphite[500],
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
          fontSize: { xs: 26, sm: 30 },
          fontWeight: 700,
          lineHeight: 1.15,
          pb: 1.75,
          mb: 2.4,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {t('title')}
      </Typography>

      <Stack
        component="section"
        aria-labelledby="system-coming-soon-title"
        alignItems="center"
        spacing={1.2}
        sx={{
          bgcolor: surface.paper,
          border: '1px solid',
          borderColor: alpha.graphite[6],
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.propertyCard,
          px: { xs: 2.5, md: 4 },
          py: { xs: 5, md: 7 },
          textAlign: 'center',
        }}
      >
        <MonitorHeartOutlinedIcon aria-hidden sx={{ color: brand.magenta[500], fontSize: 40 }} />
        <Typography
          id="system-coming-soon-title"
          component="h2"
          sx={{ color: brand.graphite[500], fontSize: 17, fontWeight: 900 }}
        >
          {t('comingSoonTitle')}
        </Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: 13.5, maxWidth: 520 }}>
          {t('comingSoonDescription')}
        </Typography>
      </Stack>
    </Box>
  )
}
