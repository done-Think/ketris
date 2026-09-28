import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

export function AgencyOverviewHeader() {
  const t = useTranslations('dashboard.agencyOverview')

  return (
    <Stack
      component="header"
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={1.4}
      sx={{ pb: 1.8, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Typography
        component="h1"
        sx={{
          color: brand.graphite[500],
          fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
          fontSize: { xs: 26, md: 30 },
          fontWeight: 800,
          lineHeight: 1.15,
        }}
      >
        {t('title')}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: { xs: 'space-between', sm: 'end' } }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.8,
            minHeight: 34,
            px: 1.4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: `${radius.sm}px`,
            bgcolor: surface.paper,
            color: brand.graphite[500],
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <CalendarTodayOutlinedIcon sx={{ color: brand.neutral[500], fontSize: iconSize.sm }} />
          {t('month')}
        </Box>
        <Button
          type="button"
          variant="outlined"
          startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
          sx={{
            minHeight: 34,
            borderRadius: `${radius.sm}px`,
            boxShadow: shadows.none,
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {t('report')}
        </Button>
      </Stack>
    </Stack>
  )
}
