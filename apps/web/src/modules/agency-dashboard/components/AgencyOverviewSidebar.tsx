'use client'

import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import { Avatar, Box, IconButton, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { agencyOverviewNavItems } from '../data/agency-overview'

export function AgencyOverviewSidebar() {
  const t = useTranslations('dashboard.agencyOverview')

  return (
    <Stack
      component="aside"
      sx={{
        width: { xs: '100%', md: 184 },
        minHeight: { md: '100vh' },
        bgcolor: brand.graphite[700],
        color: surface.lightText,
        px: 2,
        py: 2.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.1} sx={{ mb: { xs: 2, md: 3.4 } }}>
        <Box
          sx={{
            display: 'grid',
            width: 28,
            height: 28,
            placeItems: 'center',
            borderRadius: `${radius.sm}px`,
            bgcolor: brand.magenta[500],
            fontSize: 14,
            fontWeight: 900,
          }}
        >
          K
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 900, lineHeight: 1.2 }}>KETRIS</Typography>
          <Typography noWrap sx={{ color: alpha.white[62], fontSize: 10.5, fontWeight: 600 }}>
            {t('agencyName')}
          </Typography>
        </Box>
      </Stack>

      <Stack
        component="nav"
        direction={{ xs: 'row', md: 'column' }}
        spacing={0.6}
        sx={{ overflowX: { xs: 'auto', md: 'visible' }, pb: { xs: 0.6, md: 0 } }}
      >
        {agencyOverviewNavItems.map(({ id, icon: Icon, labelKey }) => {
          const active = id === 'overview'

          return (
            <Box
              key={id}
              component="button"
              type="button"
              aria-current={active ? 'page' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: { xs: 'max-content', md: 0 },
                minHeight: 36,
                border: 0,
                borderRadius: `${radius.sm}px`,
                bgcolor: active ? brand.magenta[500] : 'transparent',
                color: active ? surface.lightText : alpha.white[62],
                cursor: 'default',
                px: 1.1,
                font: 'inherit',
                textAlign: 'left',
              }}
            >
              <Icon sx={{ fontSize: iconSize.sm }} />
              <Typography sx={{ fontSize: 12.5, fontWeight: active ? 900 : 700 }}>
                {t(`navigation.${labelKey}`)}
              </Typography>
            </Box>
          )
        })}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.1}
        sx={{
          display: { xs: 'none', md: 'flex' },
          mt: 'auto',
          pt: 2,
          borderTop: '1px solid',
          borderColor: alpha.white[8],
        }}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: alpha.white[8], fontSize: 12 }}>RS</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 12, fontWeight: 900 }}>
            Ricardo Silva
          </Typography>
          <Typography noWrap sx={{ color: alpha.white[56], fontSize: 10 }}>
            Administrador
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <IconButton size="small" sx={{ color: alpha.white[62] }}>
          <LogoutOutlinedIcon sx={{ fontSize: iconSize.sm }} />
        </IconButton>
      </Stack>
    </Stack>
  )
}
