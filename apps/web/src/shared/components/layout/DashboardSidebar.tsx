'use client'

import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import ketrisLogo from '@shared/assets/ketris-logo-footer.png'
import {
  alpha,
  brand,
  componentText,
  iconSize,
  radius,
  shadows,
  surface,
  zIndex,
} from '@shared/theme/tokens'
import type { DashboardNavigationContentProps } from '@shared/types/dashboard-navigation'
import { DashboardNotificationsButton } from './DashboardNotificationsButton'

const navigationItems = [
  { labelKey: 'dashboard', href: '/dashboard', icon: DashboardOutlinedIcon },
  { labelKey: 'properties', href: '/dashboard/properties', icon: HomeWorkOutlinedIcon },
  { labelKey: 'publicProfile', href: '/dashboard/public-profile', icon: PaletteOutlinedIcon },
  { labelKey: 'leads', href: '/dashboard/leads', icon: PeopleAltOutlinedIcon },
  { labelKey: 'agenda', href: '/dashboard/agenda', icon: CalendarTodayOutlinedIcon },
  { labelKey: 'proposals', href: '/dashboard/proposals', icon: LocalOfferOutlinedIcon },
  { labelKey: 'finance', href: '/dashboard/finance', icon: InsertChartOutlinedRoundedIcon },
] as const

function isActiveNavigationItem(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const t = useTranslations('dashboard.sidebar')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <>
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: zIndex.header,
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 64,
          bgcolor: surface.paper,
          borderBottom: '1px solid',
          borderColor: alpha.graphite[8],
          boxShadow: shadows.crmMobileHeader,
          px: 2,
        }}
      >
        <Box
          component={Link}
          href="/"
          aria-label={t('backToMarketplace')}
          sx={{
            display: 'inline-flex',
            width: 42,
            height: 42,
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src={ketrisLogo.src}
            alt="Ketris"
            sx={{
              display: 'block',
              width: 112,
              maxWidth: 'none',
              height: 'auto',
            }}
          />
        </Box>

        <Stack direction="row" alignItems="center" spacing={1}>
          <DashboardNotificationsButton />
          <IconButton
            aria-label={t('openMenu')}
            aria-expanded={isMobileMenuOpen ? 'true' : undefined}
            onClick={() => setIsMobileMenuOpen(true)}
            sx={{
              width: 42,
              height: 42,
              border: '1px solid',
              borderColor: alpha.graphite[8],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              color: brand.graphite[500],
            }}
          >
            <MenuRoundedIcon sx={{ fontSize: iconSize.xl }} />
          </IconButton>
        </Stack>
      </Box>

      <Drawer
        anchor="right"
        open={isMobileMenuOpen}
        onClose={closeMobileMenu}
        slotProps={{
          paper: {
            sx: {
              display: 'flex',
              flexDirection: 'column',
              width: 280,
              maxWidth: '86vw',
              bgcolor: brand.graphite[500],
              color: surface.lightText,
              px: 2,
              py: 2.2,
            },
          },
        }}
      >
        <DashboardNavigationContent pathname={pathname} t={t} onNavigate={closeMobileMenu} />
      </Drawer>

      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          bgcolor: brand.graphite[500],
          color: surface.lightText,
          px: 2,
          py: 2.2,
        }}
      >
        <DashboardNavigationContent pathname={pathname} t={t} />
      </Box>
    </>
  )
}

function DashboardNavigationContent({ onNavigate, pathname, t }: DashboardNavigationContentProps) {
  return (
    <>
      <Box
        component={Link}
        href="/"
        aria-label={t('backToMarketplace')}
        onClick={onNavigate}
        sx={{
          display: 'block',
          width: 124,
          mx: 'auto',
          mb: 3.3,
        }}
      >
        <Box
          component="img"
          src={ketrisLogo.src}
          alt="Ketris"
          sx={{
            display: 'block',
            width: '100%',
            height: 'auto',
          }}
        />
      </Box>

      <List disablePadding sx={{ display: 'grid', gap: 0.7 }}>
        {navigationItems.map((item) => {
          const Icon = item.icon
          const active = isActiveNavigationItem(pathname, item.href)

          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={onNavigate}
              selected={active}
              sx={{
                minHeight: 36,
                borderRadius: `${radius.sm}px`,
                px: 1.2,
                color: active ? surface.lightText : alpha.white[62],
                transition: 'background-color 160ms ease, color 160ms ease',
                '&.Mui-selected, &.Mui-selected:hover': {
                  bgcolor: brand.magenta[500],
                  color: surface.lightText,
                },
                '&:hover': {
                  bgcolor: alpha.white[8],
                  color: surface.lightText,
                },
              }}
            >
              <ListItemIcon
                sx={{ color: active ? surface.lightText : alpha.white[62], minWidth: 28 }}
              >
                <Icon sx={{ fontSize: iconSize.md }} />
              </ListItemIcon>
              <ListItemText
                primary={t(item.labelKey)}
                primaryTypographyProps={{
                  sx: { fontSize: 12, fontWeight: active ? 900 : 700 },
                }}
              />
            </ListItemButton>
          )
        })}
      </List>

      <Box sx={{ flex: 1 }} />
      <Divider sx={{ borderColor: alpha.white[8], mb: 1.7 }} />
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: brand.neutral[700],
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          GS
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 11.5, fontWeight: 900 }}>
            Guilherme Silva
          </Typography>
          <Typography noWrap sx={{ ...componentText.footerLegal, color: alpha.white[50] }}>
            {t('userRole')}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={t('back')}>
          <IconButton
            component={Link}
            href="/"
            aria-label={t('backToMarketplace')}
            onClick={onNavigate}
            sx={{
              width: 32,
              height: 32,
              color: alpha.white[62],
              '&:hover': {
                bgcolor: alpha.white[8],
                color: surface.lightText,
              },
            }}
          >
            <LogoutOutlinedIcon sx={{ fontSize: iconSize.md }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  )
}
