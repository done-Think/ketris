'use client'

import { useMemo, useState } from 'react'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import type { SvgIconComponent } from '@mui/icons-material'
import { Avatar, Box, Drawer, IconButton, Stack, Tooltip, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import type { Papel } from '@server/auth/domain/user.entity'
import { CrmAccessBoundary } from '@modules/crm/components/CrmAccessBoundary'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import { getInitials } from '@shared/utils/get-initials'

const sidebarWidth = 200

type NavHref =
  | '/dashboard'
  | '/crm'
  | '/crm/contacts'
  | '/dashboard/properties'
  | '/dashboard/public-profile'
  | '/dashboard/agenda'
  | '/crm/proposals'
  | '/dashboard/finance'

interface NavItem {
  labelKey: string
  href: NavHref
  icon: SvgIconComponent
  /** Omitted = visible to every tenant role (ADMIN, OWNER, AGENT). */
  roles?: readonly Papel[]
}

const navigationItems: readonly NavItem[] = [
  {
    labelKey: 'dashboard',
    href: '/dashboard',
    icon: BarChartOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  { labelKey: 'pipeline', href: '/crm', icon: ViewKanbanOutlinedIcon },
  { labelKey: 'contacts', href: '/crm/contacts', icon: PeopleOutlineIcon },
  { labelKey: 'properties', href: '/dashboard/properties', icon: HomeWorkOutlinedIcon },
  {
    labelKey: 'publicProfile',
    href: '/dashboard/public-profile',
    icon: PaletteOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  { labelKey: 'agenda', href: '/dashboard/agenda', icon: CalendarTodayOutlinedIcon },
  { labelKey: 'proposals', href: '/crm/proposals', icon: InsertDriveFileOutlinedIcon },
  {
    labelKey: 'finance',
    href: '/dashboard/finance',
    icon: InsertChartOutlinedRoundedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
]

export interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const t = useTranslations('common.appShell')
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isPublicCrmRoute = pathname === '/crm' || pathname === '/crm/contacts'
  const userName = session?.user?.name ?? t('defaultUserName')
  const userContext = session?.user?.email ?? t('defaultUserContext')
  const userInitials = useMemo(() => getInitials(userName), [userName])
  const visibleItems = useMemo(
    () =>
      navigationItems.filter(
        (item) => !item.roles || (session?.papel && item.roles.includes(session.papel)),
      ),
    [session],
  )

  const sidebar = (
    <Stack
      component="aside"
      sx={{
        width: sidebarWidth,
        height: '100%',
        bgcolor: brand.graphite[600],
        color: surface.lightText,
        px: 2,
        py: 2.5,
      }}
    >
      <AppLogo
        src={ketrisLogoFooter}
        width={112}
        sx={{ alignSelf: 'flex-start', mb: 3.5, ml: 0.5 }}
      />

      <Stack
        component="nav"
        spacing={0.375}
        aria-label={t('ariaLabel')}
        sx={{ ml: -1.5, mr: -0.5 }}
      >
        {visibleItems.map(({ labelKey, href, icon: Icon }) => {
          const targetPath = href.split('?')[0]
          const active =
            targetPath === '/crm'
              ? pathname === '/crm' || pathname.startsWith('/crm/opportunities')
              : pathname === targetPath || pathname.startsWith(`${targetPath}/`)

          return (
            <Box
              key={labelKey}
              component={Link}
              href={href}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? 'page' : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.125,
                minHeight: 36,
                px: 1.125,
                borderLeft: '3px solid',
                borderColor: active ? 'primary.main' : 'transparent',
                borderRadius: `${radius.sm}px`,
                bgcolor: active ? alpha.white[8] : 'transparent',
                color: active ? surface.lightText : alpha.white[62],
                textDecoration: 'none',
                transition: 'background-color 160ms ease, color 160ms ease',
                '&:hover': {
                  bgcolor: alpha.white[8],
                  color: surface.lightText,
                },
              }}
            >
              <Icon sx={{ fontSize: iconSize.sm, color: active ? 'primary.main' : 'inherit' }} />
              <Typography
                sx={{
                  fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  lineHeight: '18px',
                  letterSpacing: 0,
                }}
              >
                {t(labelKey)}
              </Typography>
            </Box>
          )
        })}
      </Stack>

      <Stack
        direction="row"
        spacing={1.3}
        alignItems="center"
        sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: alpha.white[8] }}
      >
        <Avatar
          src={session?.user?.image ?? undefined}
          alt={userName}
          sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontSize: 13, fontWeight: 800 }}
        >
          {userInitials}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>
            {userName}
          </Typography>
          <Typography noWrap sx={{ color: alpha.white[56], fontSize: 10.5 }}>
            {userContext}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Tooltip title={t('backToMarketplace')}>
          <IconButton
            component={Link}
            href="/"
            aria-label={t('backToMarketplace')}
            sx={{
              width: 32,
              height: 32,
              color: alpha.white[62],
              '&:hover': { bgcolor: alpha.white[8], color: surface.lightText },
            }}
          >
            <LogoutOutlinedIcon sx={{ fontSize: iconSize.sm }} />
          </IconButton>
        </Tooltip>
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
        justifyContent="space-between"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          inset: '0 0 auto 0',
          zIndex: 20,
          height: 64,
          px: 2,
          bgcolor: brand.graphite[600],
          color: surface.lightText,
          boxShadow: shadows.crmMobileHeader,
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
        <AppLogo src={ketrisLogoFooter} width={92} />
        <Avatar
          src={session?.user?.image ?? undefined}
          alt={userName}
          sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 12, fontWeight: 800 }}
        >
          {userInitials}
        </Avatar>
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
          minWidth: 0,
          ml: { md: `${sidebarWidth}px` },
          pt: { xs: '64px', md: 0 },
        }}
      >
        {isPublicCrmRoute ? children : <CrmAccessBoundary>{children}</CrmAccessBoundary>}
      </Box>
    </Box>
  )
}
