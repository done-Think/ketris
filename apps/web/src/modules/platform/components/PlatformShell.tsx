'use client'

import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
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
import { DashboardNotificationsButton, SidebarCollapseButton } from '@shared/components/layout'
import { AppLogo } from '@shared/components/ui'
import { useSidebarPreferencesStore } from '@shared/stores/sidebar-preferences-store'
import { alpha, brand, radius, surface } from '@shared/theme/tokens'

import type { NavigationItem, PlatformShellProps } from '../types/platform-shell'
import {
  styles,
  getStackStyles,
  getStackStyles2,
  getTypographyStyles,
  getButtonStyles,
  getStackStyles3,
  getTypographyStyles2,
  getBoxStyles,
  getBoxStyles2,
} from '../styles/platform-shell.styles'

const navigationItems: readonly NavigationItem[] = [
  { label: 'overview', icon: HomeOutlinedIcon, href: '/platform' },
  { label: 'tenants', icon: ApartmentOutlinedIcon, href: '/platform/tenants' },
  { label: 'users', icon: PeopleOutlineIcon, href: '/platform/admins' },
  { label: 'plans', icon: SellOutlinedIcon, href: '/platform/plans' },
  { label: 'finance', icon: AccountBalanceWalletOutlinedIcon, href: '/platform/finance' },
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
    <Box sx={styles.box}>
      <Stack component="aside" sx={getStackStyles({ collapsed })}>
        <Stack alignItems="center" justifyContent="center" sx={styles.stack}>
          <AppLogo
            src={collapsed ? '/ketris-tab-icon.png' : ketrisLogoFooter}
            width={collapsed ? 40 : 120}
            sx={styles.appLogo}
          />
          {isMobile && (
            <IconButton
              aria-label={t('closeNavigation')}
              onClick={() => setMobileOpen(false)}
              sx={styles.iconButton}
            >
              <CloseRoundedIcon />
            </IconButton>
          )}
        </Stack>

        <Stack
          component="nav"
          spacing={0.5}
          aria-label={t('ariaLabel')}
          sx={getStackStyles2({ collapsed })}
        >
          {navigationItems.map(({ label, icon: Icon, href }) => {
            const active =
              href === pathname ||
              (href === '/platform/tenants' && pathname.startsWith('/platform/tenants/')) ||
              (href === '/platform/admins' && pathname.startsWith('/platform/admins'))
            const content = (
              <>
                <Icon sx={styles.icon} />
                <Typography sx={getTypographyStyles({ collapsed, active })}>{t(label)}</Typography>
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
                  sx={navItemSx(active, collapsed, true)}
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
                sx={navItemSx(false, collapsed, false)}
              >
                {content}
              </Box>
            )
          })}
        </Stack>

        <Box sx={styles.box2} />

        <Tooltip title={commonT('backToMarketplace')} placement="right">
          <Button
            component={Link}
            href="/"
            aria-label={commonT('backToMarketplace')}
            startIcon={<LogoutOutlinedIcon sx={styles.logoutOutlinedIcon} />}
            sx={getButtonStyles({ collapsed })}
          >
            {collapsed ? null : commonT('backToMarketplace')}
          </Button>
        </Tooltip>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.8}
          justifyContent={collapsed ? 'center' : 'flex-start'}
          sx={getStackStyles3({ collapsed })}
        >
          <Box aria-hidden sx={styles.box3} />
          <Typography sx={getTypographyStyles2({ collapsed })}>{t('online')}</Typography>
        </Stack>
      </Stack>
      {showCollapseControl ? (
        <SidebarCollapseButton
          collapsed={collapsed}
          onToggle={toggleSidebarCollapsed}
          expandLabel={t('expandNavigation')}
          collapseLabel={t('collapseNavigation')}
          collapseTooltip={t('collapseMenu')}
        />
      ) : null}
    </Box>
  )

  return (
    <Box sx={styles.box4}>
      <Box sx={getBoxStyles({ sidebarCollapsed })}>{sidebar(sidebarCollapsed)}</Box>
      <Stack
        component="header"
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={styles.stack2}
      >
        <AppLogo src={ketrisLogoFooter} variant="transparent" width={42} sx={styles.appLogo2} />
        <Stack direction="row" alignItems="center" spacing={1}>
          <DashboardNotificationsButton placement="navigationHeader" notifications={[]} />
          <Tooltip title={t('openNavigation')}>
            <IconButton
              aria-label={t('openNavigation')}
              onClick={() => setMobileOpen(true)}
              sx={styles.iconButton2}
            >
              <MenuRoundedIcon sx={styles.menuRoundedIcon} />
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
            sx: styles.paper,
            'aria-label': t('ariaLabel'),
          },
        }}
      >
        {sidebar(false, true, false)}
      </Drawer>
      <Box component="main" sx={getBoxStyles2({ sidebarCollapsed })}>
        {children}
      </Box>
    </Box>
  )
}

function navItemSx(active: boolean, collapsed: boolean, interactive: boolean) {
  return {
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    bgcolor: active ? alpha.white[8] : 'transparent',
    borderRadius: `${radius.sm}px`,
    borderLeft: '3px solid',
    borderColor: active ? 'primary.main' : 'transparent',
    color: active ? surface.lightText : alpha.white[62],
    cursor: interactive ? 'pointer' : 'default',
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
    '&:hover': interactive ? { bgcolor: alpha.white[8], color: surface.lightText } : undefined,
  }
}
