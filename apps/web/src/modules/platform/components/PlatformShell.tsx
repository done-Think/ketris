'use client'

import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import type { SvgIconComponent } from '@mui/icons-material'
import { Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'
import { alpha, brand, iconSize, radius, surface } from '@shared/theme/tokens'

const sidebarWidth = 192

type NavigationItem = {
  label: 'overview' | 'tenants' | 'users' | 'plans' | 'finance' | 'system' | 'logs'
  icon: SvgIconComponent
}

const navigationItems: readonly NavigationItem[] = [
  { label: 'overview', icon: HomeOutlinedIcon },
  { label: 'tenants', icon: ApartmentOutlinedIcon },
  { label: 'users', icon: PeopleOutlineIcon },
  { label: 'plans', icon: SellOutlinedIcon },
  { label: 'finance', icon: AccountBalanceWalletOutlinedIcon },
  { label: 'system', icon: SettingsOutlinedIcon },
  { label: 'logs', icon: ShowChartOutlinedIcon },
]

export function PlatformShell({ children }: { children: ReactNode }) {
  const t = useTranslations('platform.overview.navigation')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const overviewActive = pathname === '/platform'

  const sidebar = (
    <Stack
      component="aside"
      sx={{
        height: '100%',
        bgcolor: brand.graphite[800],
        color: surface.lightText,
        px: 1.25,
        py: 2.4,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 0.75, mb: 3.1 }}>
        <AppLogo src={ketrisLogoFooter} variant="transparent" width={54} sx={{ mb: 0 }} />
        <Typography
          sx={{
            bgcolor: brand.magenta[500],
            borderRadius: `${radius.sm}px`,
            fontSize: 9,
            fontWeight: 900,
            lineHeight: 1,
            px: 0.55,
            py: 0.4,
          }}
        >
          {t('admin')}
        </Typography>
      </Stack>

      <Stack component="nav" spacing={0.55} aria-label={t('ariaLabel')}>
        {navigationItems.map(({ label, icon: Icon }) => {
          const active = label === 'overview' && overviewActive
          const content = (
            <>
              <Icon sx={{ fontSize: iconSize.md }} />
              <Typography sx={{ flex: 1, fontSize: 12, fontWeight: active ? 800 : 600 }}>
                {t(label)}
              </Typography>
              {active && (
                <Box
                  aria-hidden
                  sx={{
                    width: 3,
                    height: 15,
                    borderRadius: radius.full,
                    bgcolor: brand.magenta[500],
                  }}
                />
              )}
            </>
          )

          if (label === 'overview') {
            return (
              <Box
                key={label}
                component={Link}
                href="/platform"
                aria-current={active ? 'page' : undefined}
                onClick={() => setMobileOpen(false)}
                sx={navItemSx(active)}
              >
                {content}
              </Box>
            )
          }

          return (
            <Box key={label} aria-disabled="true" sx={navItemSx(false)}>
              {content}
            </Box>
          )
        })}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.7}
        sx={{ mt: 'auto', px: 0.8, pt: 2, borderTop: '1px solid', borderColor: alpha.white[8] }}
      >
        <Box
          aria-hidden
          sx={{ width: 7, height: 7, borderRadius: radius.full, bgcolor: brand.semantic.success }}
        />
        <Typography sx={{ color: alpha.white[72], fontSize: 11, fontWeight: 700 }}>
          {t('online')}
        </Typography>
      </Stack>
    </Stack>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: surface.app }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'fixed',
          inset: '0 auto 0 0',
          width: sidebarWidth,
          zIndex: 10,
        }}
      >
        {sidebar}
      </Box>
      <Stack
        component="header"
        direction="row"
        alignItems="center"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          inset: '0 0 auto 0',
          zIndex: 20,
          height: 60,
          px: 1.5,
          bgcolor: brand.graphite[800],
          color: surface.lightText,
        }}
      >
        <Tooltip title={t('openNavigation')}>
          <IconButton
            aria-label={t('openNavigation')}
            onClick={() => setMobileOpen(true)}
            sx={{ color: 'inherit' }}
          >
            <MenuRoundedIcon />
          </IconButton>
        </Tooltip>
        <AppLogo src={ketrisLogoFooter} variant="transparent" width={58} sx={{ mb: 0, ml: 1 }} />
      </Stack>
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: sidebarWidth, border: 0 } }}
      >
        {sidebar}
      </Drawer>
      <Box
        component="main"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          pt: { xs: '60px', md: 0 },
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

function navItemSx(active: boolean) {
  return {
    alignItems: 'center',
    bgcolor: active ? 'rgba(243, 2, 116, 0.2)' : 'transparent',
    borderRadius: `${radius.sm}px`,
    color: active ? brand.magenta[300] : alpha.white[62],
    cursor: active ? 'pointer' : 'default',
    display: 'flex',
    gap: 1.1,
    minHeight: 36,
    px: 1,
    textDecoration: 'none',
    '&:hover': active ? { bgcolor: 'rgba(243, 2, 116, 0.25)' } : undefined,
  }
}
