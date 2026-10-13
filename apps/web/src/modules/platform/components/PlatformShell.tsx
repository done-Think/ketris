'use client'

import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import { Box, Button, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { DashboardNotificationsButton } from '@shared/components/layout'
import { AppLogo } from '@shared/components/ui'
import { useSidebarPreferencesStore } from '@shared/stores/sidebar-preferences-store'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import type { NavigationItem, PlatformShellProps } from '../types/platform-shell'

const sidebarExpandedWidth = 240
const sidebarCollapsedWidth = 72

const marketplaceActionSx = {
  minHeight: 32,
  px: 1,
  color: alpha.white[62],
  fontSize: 11,
  fontWeight: 600,
  lineHeight: '16px',
  textTransform: 'none',
  '& .MuiButton-startIcon': { mr: 0.75 },
  '&:hover': { bgcolor: alpha.white[8], color: surface.lightText },
} as const

const navigationItems: readonly NavigationItem[] = [
  { label: 'overview', icon: HomeOutlinedIcon, href: '/platform' },
  { label: 'tenants', icon: ApartmentOutlinedIcon, href: '/platform/tenants' },
  { label: 'users', icon: PeopleOutlineIcon, href: '/platform/admins' },
  { label: 'plans', icon: SellOutlinedIcon },
  { label: 'finance', icon: AccountBalanceWalletOutlinedIcon },
  { label: 'system', icon: SettingsOutlinedIcon, href: '/platform/system' },
  { label: 'logs', icon: ShowChartOutlinedIcon },
]

export function PlatformShell({ children }: PlatformShellProps) {
  const t = useTranslations('platform.overview.navigation')
  const commonT = useTranslations('common.appShell')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarCollapsed = useSidebarPreferencesStore((state) => state.isCollapsed)
  const toggleSidebarCollapsed = useSidebarPreferencesStore((state) => state.toggleCollapsed)

  const sidebar = (collapsed = false, isMobile = false, showCollapseControl = true) => (
    <Stack
      component="aside"
      sx={{
        width: collapsed ? sidebarCollapsedWidth : sidebarExpandedWidth,
        height: '100%',
        bgcolor: brand.graphite[600],
        color: surface.lightText,
        px: collapsed ? 1 : 2,
        py: 2.5,
        transition: 'width 180ms ease, padding 180ms ease',
      }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%', height: collapsed ? 84 : 48, mb: 1.5, position: 'relative' }}
      >
        <AppLogo
          src={collapsed ? '/ketris-tab-icon.png' : ketrisLogoFooter}
          width={collapsed ? 40 : 120}
          sx={{ left: '50%', position: 'absolute', top: 0, transform: 'translateX(-50%)' }}
        />
        {showCollapseControl ? (
          <Tooltip title={collapsed ? t('expandNavigation') : t('collapseMenu')} placement="right">
            <Button
              aria-label={collapsed ? t('expandNavigation') : t('collapseNavigation')}
              onClick={toggleSidebarCollapsed}
              startIcon={
                <KeyboardDoubleArrowLeftRoundedIcon
                  sx={{
                    fontSize: iconSize.md,
                    transform: collapsed ? 'rotate(180deg)' : 'none',
                    transition: 'transform 180ms ease',
                  }}
                />
              }
              sx={{
                position: 'absolute',
                right: collapsed ? '50%' : 0,
                top: collapsed ? 48 : 2,
                transform: collapsed ? 'translateX(50%)' : 'none',
                minWidth: 36,
                minHeight: 36,
                px: 0,
                color: alpha.white[62],
                '& .MuiButton-startIcon': { m: 0 },
                '&:hover': { bgcolor: alpha.white[8], color: surface.lightText },
              }}
            />
          </Tooltip>
        ) : null}
        {isMobile && (
          <IconButton
            aria-label={t('closeNavigation')}
            onClick={() => setMobileOpen(false)}
            sx={{ color: 'inherit', position: 'absolute', right: 0, top: 0 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        )}
      </Stack>

      <Stack
        component="nav"
        spacing={0.5}
        aria-label={t('ariaLabel')}
        sx={{ mx: collapsed ? 0 : -0.5 }}
      >
        {navigationItems.map(({ label, icon: Icon, href }) => {
          const active =
            href === pathname ||
            (href === '/platform/tenants' && pathname.startsWith('/platform/tenants/')) ||
            (href === '/platform/admins' && pathname.startsWith('/platform/admins'))
          const content = (
            <>
              <Icon sx={{ fontSize: iconSize.md }} />
              <Typography
                sx={{
                  display: collapsed ? 'none' : 'block',
                  flex: 1,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  lineHeight: '20px',
                }}
              >
                {t(label)}
              </Typography>
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
                aria-label={collapsed ? t(label) : undefined}
                sx={navItemSx(active, collapsed)}
              >
                {content}
              </Box>
            )
          }

          return (
            <Box
              key={label}
              aria-disabled="true"
              aria-label={collapsed ? t(label) : undefined}
              sx={navItemSx(false, collapsed)}
            >
              {content}
            </Box>
          )
        })}
      </Stack>

      <Box sx={{ flexGrow: 1, minHeight: 2 }} />

      <Tooltip title={commonT('backToMarketplace')} placement="right">
        <Button
          component={Link}
          href="/"
          aria-label={commonT('backToMarketplace')}
          startIcon={<LogoutOutlinedIcon sx={{ fontSize: iconSize.sm }} />}
          sx={{
            alignSelf: collapsed ? 'center' : 'stretch',
            justifyContent: collapsed ? 'center' : 'flex-start',
            minWidth: collapsed ? 44 : 0,
            ...marketplaceActionSx,
            minHeight: 40,
            mb: 1.5,
            px: collapsed ? 0 : 1.5,
            '& .MuiButton-startIcon': { ml: 0, mr: collapsed ? 0 : 0.75 },
          }}
        >
          {collapsed ? null : commonT('backToMarketplace')}
        </Button>
      </Tooltip>

      <Stack
        direction="row"
        alignItems="center"
        spacing={0.8}
        justifyContent={collapsed ? 'center' : 'flex-start'}
        sx={{ pt: 2, px: collapsed ? 0 : 0.9, borderTop: '1px solid', borderColor: alpha.white[8] }}
      >
        <Box
          aria-hidden
          sx={{ width: 8, height: 8, borderRadius: radius.full, bgcolor: brand.semantic.success }}
        />
        <Typography
          sx={{
            display: collapsed ? 'none' : 'block',
            color: alpha.white[72],
            fontSize: 12,
            fontWeight: 700,
          }}
        >
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
          width: sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth,
          zIndex: 10,
          transition: 'width 180ms ease',
        }}
      >
        {sidebar(sidebarCollapsed)}
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
        {sidebar(false, true, false)}
      </Drawer>
      <Box
        component="main"
        sx={{
          width: {
            xs: '100%',
            md: `calc(100% - ${sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px)`,
          },
          ml: { md: `${sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px` },
          pt: { xs: '64px', md: 0 },
          minWidth: 0,
          transition: 'margin-left 180ms ease, width 180ms ease',
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

function navItemSx(active: boolean, collapsed: boolean) {
  return {
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    bgcolor: active ? alpha.white[8] : 'transparent',
    borderRadius: `${radius.sm}px`,
    borderLeft: '3px solid',
    borderColor: active ? 'primary.main' : 'transparent',
    color: active ? surface.lightText : alpha.white[62],
    cursor: active ? 'pointer' : 'default',
    display: 'flex',
    gap: 1.5,
    minHeight: 44,
    px: collapsed ? 0 : 1.5,
    width: collapsed ? 44 : '100%',
    alignSelf: collapsed ? 'center' : 'stretch',
    textDecoration: 'none',
    transition: 'background-color 160ms ease, color 160ms ease',
    '& svg': { color: active ? 'primary.main' : 'inherit' },
    '&:focus-visible': { outline: `2px solid ${brand.magenta[300]}`, outlineOffset: 2 },
    '&:hover': { bgcolor: alpha.white[8], color: surface.lightText },
  }
}
