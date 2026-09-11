'use client'

import { Box, IconButton, Stack, Typography } from '@mui/material'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import { Link as NextLink } from '@/i18n/navigation'
import { useSession } from 'next-auth/react'

import { brand, iconSize } from '@shared/theme/tokens'
import { ownerMobileSummary } from '../fixtures/owner-dashboard-fixtures'

export function OwnerDashboardMobileHeader() {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.trim().split(/\s+/)[0] || 'Carlos'

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h1" sx={{ fontSize: 20, fontWeight: 700 }}>
          Meu Painel
        </Typography>
        <IconButton
          component={NextLink}
          href="/dashboard/proposals"
          aria-label="Ver propostas recebidas"
          sx={{ width: 44, height: 44, color: brand.graphite[500] }}
        >
          <NotificationsNoneOutlinedIcon sx={{ fontSize: iconSize.xl }} />
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: 10,
              right: 12,
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'primary.main',
            }}
          />
        </IconButton>
      </Stack>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography sx={{ color: brand.neutral[500], fontSize: 13 }}>Olá, {firstName}</Typography>
        <Typography sx={{ color: brand.neutral[500], fontSize: 11 }}>
          {ownerMobileSummary.dateLabel}
        </Typography>
      </Stack>
    </Box>
  )
}
