'use client'

import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
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
import { DashboardNotificationsButton } from '@shared/components/layout'
import { AppLogo } from '@shared/components/ui'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

const sidebarWidth = 200

type NavigationItem = {
  label: 'overview' | 'tenants' | 'users' | 'plans' | 'finance' | 'system' | 'logs'
  icon: SvgIconComponent
  href?: '/platform' | '/platform/tenants' | '/platform/system' | '/platform/admins/new'
}

const navigationItems: readonly NavigationItem[] = [
  { label: 'overview', icon: HomeOutlinedIcon, href: '/platform' },
  { label: 'tenants', icon: ApartmentOutlinedIcon, href: '/platform/tenants' },
  { label: 'users', icon: PeopleOutlineIcon, href: '/platform/admins/new' },
  { label: 'plans', icon: SellOutlinedIcon },
  { label: 'finance', icon: AccountBalanceWalletOutlinedIcon },
  { label: 'system', icon: SettingsOutlinedIcon, href: '/platform/system' },
  { label: 'logs', icon: ShowChartOutlinedIcon },
]

export function PlatformShell({ children }: { children: ReactNode }) {
  const t = useTranslations('platform.overview.navigation')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebar = (isMobile = false) => (
    <Stack
      component="aside"
      sx={{
        height: '100%',
        bgcolor: brand.graphite[800],
        color: surface.lightText,
        px: 1.25,
        py: 2.5,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.8} sx={{ px: 0.75, mb: 3.25 }}>
        <AppLogo src={ketrisLogoFooter} variant="transparent" width={84} sx={{ mb: 0 }} />
        <Typography
          sx={{
            bgcolor: brand.magenta[500],
            borderRadius: `${radius.sm}px`,
            fontSize: 10.5,
            fontWeight: 900,
            lineHeight: 1,
            px: 0.7,
            py: 0.45,
            whiteSpace: 'nowrap',
          }}
        >
          {t('admin')}
        </Typography>
        {isMobile && (
          <IconButton
            aria-label={t('closeNavigation')}
            onClick={() => setMobileOpen(false)}
            sx={{ color: 'inherit', ml: 'auto' }}
          >
            <CloseRoundedIcon />
          </IconButton>
        )}
      </Stack>

      <Stack component="nav" spacing={0.55} aria-label={t('ariaLabel')}>
        {navigationItems.map(({ label, icon: Icon, href }) => {
          const active =
            href === pathname ||
            (href === '/platform/tenants' && pathname.startsWith('/platform/tenants/'))
          const content = (
            <>
              <Icon sx={{ fontSize: iconSize.lg }} />
              <Typography sx={{ flex: 1, fontSize: 13, fontWeight: active ? 800 : 600 }}>
                {t(label)}
              </Typography>
              {active && (
                <Box
                  aria-hidden
                  sx={{
                    width: 4,
                    height: 18,
                    borderRadius: radius.full,
                    bgcolor: brand.magenta[500],
                  }}
                />
              )}
            </>
          )

          if (href) {
            return (
              <Box
                key={label}
                component={Link}
                href={href}
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
        spacing={0.8}
        sx={{ mt: 'auto', px: 0.9, pt: 2.5, borderTop: '1px solid', borderColor: alpha.white[8] }}
      >
        <Box
          aria-hidden
          sx={{ width: 8, height: 8, borderRadius: radius.full, bgcolor: brand.semantic.success }}
        />
        <Typography sx={{ color: alpha.white[72], fontSize: 12, fontWeight: 700 }}>
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
        {sidebar()}
      </Box>
      <Stack
        component="header"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          inset: '0 0 auto 0',
          zIndex: 20,
          height: 64,
          minHeight: 64,
          maxHeight: 64,
          overflow: 'hidden',
          px: 2,
          bgcolor: surface.paper,
          color: brand.graphite[500],
          boxShadow: shadows.crmMobileHeader,
        }}
      >
        <AppLogo
          src={ketrisLogoFooter}
          variant="transparent"
          width={42}
          sx={{
            height: 42,
            overflow: 'hidden',
            '& img': {
              width: 112,
              maxWidth: 'none',
            },
          }}
        />
        <Stack direction="row" alignItems="center" spacing={1}>
          <DashboardNotificationsButton notifications={[]} />
          <Tooltip title={t('openNavigation')}>
            <IconButton
              aria-label={t('openNavigation')}
              onClick={() => setMobileOpen(true)}
              sx={{
                width: 42,
                height: 42,
                border: '1px solid',
                borderColor: alpha.graphite[8],
                borderRadius: `${radius.sm}px`,
                color: brand.graphite[500],
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: iconSize.xl }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          paper: {
            sx: { width: 'min(280px, calc(100vw - 48px))', border: 0 },
            'aria-label': t('ariaLabel'),
          },
        }}
      >
        {sidebar(true)}
      </Drawer>
      <Box
        component="main"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },
          ml: { md: `${sidebarWidth}px` },
          pt: { xs: '64px', md: 0 },
          minWidth: 0,
          '& :focus-visible, & .Mui-focusVisible': {
            outline: `2px solid ${brand.magenta[500]}`,
            outlineOffset: 2,
          },
        }}
      >
        {['/platform', '/platform/tenants', '/platform/system'].includes(pathname) && (
          <Typography
            sx={{
              px: { xs: 2, md: 3, lg: 4 },
              pt: { xs: 1.5, md: 1 },
              fontSize: 12,
              lineHeight: { xs: 1.4, md: 'inherit' },
              color: brand.neutral[500],
            }}
          >
            {t('demoNotice')}
          </Typography>
        )}
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
    gap: 1,
    minHeight: 42,
    px: 1,
    textDecoration: 'none',
    '&:focus-visible': { outline: `2px solid ${brand.magenta[300]}`, outlineOffset: 2 },
    '&:hover': active ? { bgcolor: 'rgba(243, 2, 116, 0.25)' } : undefined,
  }
}
