'use client'

import { useMemo, useState } from 'react'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import InsertChartOutlinedRoundedIcon from '@mui/icons-material/InsertChartOutlinedRounded'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined'
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { CrmAccessBoundary } from '@modules/crm/components/CrmAccessBoundary'
import { EditCurrentUserProfileDialog } from '@modules/auth/components/EditCurrentUserProfileDialog'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import type { AppShellNavItem, AppShellProps } from '@shared/types/app-shell'
import { getInitials } from '@shared/utils/get-initials'
import { useSidebarPreferencesStore } from '@shared/stores/sidebar-preferences-store'
import { DashboardNotificationsButton } from './DashboardNotificationsButton'

const sidebarExpandedWidth = 240
const sidebarCollapsedWidth = 72

const navigationItems: readonly AppShellNavItem[] = [
  {
    labelKey: 'dashboard',
    href: '/dashboard',
    icon: BarChartOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  {
    labelKey: 'agencyOverview',
    href: '/dashboard/agency-overview',
    icon: InsertChartOutlinedRoundedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  { labelKey: 'pipeline', href: '/crm', icon: ViewKanbanOutlinedIcon },
  { labelKey: 'contacts', href: '/crm/contacts', icon: PeopleOutlineIcon },
  { labelKey: 'leads', href: '/dashboard/leads', icon: PeopleAltOutlinedIcon },
  {
    labelKey: 'team',
    href: '/dashboard/team',
    icon: PeopleAltOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  { labelKey: 'properties', href: '/dashboard/properties', icon: HomeWorkOutlinedIcon },
  { labelKey: 'contracts', href: '/dashboard/contracts', icon: DescriptionOutlinedIcon },
  {
    labelKey: 'publicProfile',
    href: '/dashboard/public-profile',
    icon: PaletteOutlinedIcon,
    roles: ['AGENT'],
  },
  {
    labelKey: 'agencyPublicProfile',
    href: '/dashboard/public-profile/agency',
    icon: PaletteOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  { labelKey: 'agenda', href: '/dashboard/agenda', icon: CalendarTodayOutlinedIcon },
  {
    labelKey: 'maintenance',
    href: '/dashboard/maintenance',
    icon: BuildOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  {
    labelKey: 'finance',
    href: '/dashboard/finance',
    icon: InsertChartOutlinedRoundedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
  {
    labelKey: 'charges',
    href: '/dashboard/finance/charges',
    icon: ReceiptLongOutlinedIcon,
    roles: ['ADMIN', 'OWNER'],
  },
]

export function AppShell({ children, allowLocalDashboardPreview = false }: AppShellProps) {
  const t = useTranslations('common.appShell')
  const pathname = usePathname()
  const { data: session, status, update } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileEditorOpen, setProfileEditorOpen] = useState(false)
  const sidebarCollapsed = useSidebarPreferencesStore((state) => state.isCollapsed)
  const toggleSidebarCollapsed = useSidebarPreferencesStore((state) => state.toggleCollapsed)
  const isPublicCrmRoute = pathname === '/crm' || pathname === '/crm/contacts'
  const isLocalDashboardPreview = allowLocalDashboardPreview
  const userName = session?.user?.name ?? t('defaultUserName')
  const userContext = session?.user?.email ?? t('defaultUserContext')
  const userInitials = useMemo(() => getInitials(userName), [userName])
  const visibleItems = useMemo(() => {
    if (isLocalDashboardPreview) return navigationItems

    return navigationItems.filter(
      (item) => !item.roles || (session?.papel && item.roles.includes(session.papel)),
    )
  }, [isLocalDashboardPreview, session])
  // Rotas como /crm e /dashboard são prefixo de várias outras entradas do menu (ex.:
  // /dashboard/finance). O item ativo deve ser o de prefixo mais específico que bate com a
  // rota atual, e não todo item cujo prefixo é um match parcial.
  const activeTargetPath = useMemo(() => {
    let bestMatch: string | null = null

    for (const item of visibleItems) {
      const targetPath = item.href.split('?')[0]
      const matches = pathname === targetPath || pathname.startsWith(`${targetPath}/`)

      if (matches && (!bestMatch || targetPath.length > bestMatch.length)) {
        bestMatch = targetPath
      }
    }

    return bestMatch
  }, [pathname, visibleItems])

  async function handleProfileUpdated(updatedUser: {
    name: string
    email: string
    avatarUrl?: string | null
  }) {
    await update({
      user: {
        ...session?.user,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.avatarUrl ?? undefined,
      },
    })
  }

  const renderSidebar = (collapsed = false, showCollapseControl = true) => {
    const width = collapsed ? sidebarCollapsedWidth : sidebarExpandedWidth

    return (
      <Stack
        component="aside"
        sx={{
          width,
          height: '100%',
          bgcolor: brand.graphite[600],
          color: surface.lightText,
          overflowX: 'hidden',
          px: collapsed ? 1 : 2,
          py: 2.5,
          transition: 'width 180ms ease, padding 180ms ease',
        }}
      >
        <AppLogo
          src={collapsed ? '/ketris-tab-icon.png' : ketrisLogoFooter}
          width={collapsed ? 40 : 120}
          sx={{ alignSelf: 'center', mb: 1.5 }}
        />

        <Stack
          component="nav"
          spacing={0.5}
          aria-label={t('ariaLabel')}
          sx={{ mx: collapsed ? 0 : -0.5 }}
        >
          {status === 'loading'
            ? navigationItems.map((item) => (
                <Skeleton
                  key={item.labelKey}
                  variant="rounded"
                  height={44}
                  sx={{
                    alignSelf: collapsed ? 'center' : 'stretch',
                    bgcolor: alpha.white[8],
                    borderRadius: `${radius.sm}px`,
                    width: collapsed ? 44 : '100%',
                  }}
                />
              ))
            : visibleItems.map(({ labelKey, href, icon: Icon }) => {
                const targetPath = href.split('?')[0]
                const active = targetPath === activeTargetPath

                return (
                  <Box
                    key={labelKey}
                    component={Link}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    aria-label={collapsed ? t(labelKey) : undefined}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: 1.5,
                      minHeight: 44,
                      px: collapsed ? 0 : 1.5,
                      width: collapsed ? 44 : '100%',
                      alignSelf: collapsed ? 'center' : 'stretch',
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
                    <Icon
                      sx={{
                        fontSize: iconSize.md,
                        color: active ? 'primary.main' : 'inherit',
                      }}
                    />
                    <Typography
                      sx={{
                        display: collapsed ? 'none' : 'block',
                        fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
                        fontSize: 14,
                        fontWeight: active ? 600 : 500,
                        lineHeight: '20px',
                        letterSpacing: 0,
                      }}
                    >
                      {t(labelKey)}
                    </Typography>
                  </Box>
                )
              })}
        </Stack>

        <Box sx={{ flexGrow: 1, minHeight: 2 }} />

        {showCollapseControl ? (
          <Tooltip
            title={collapsed ? t('expandNavigation') : t('collapseNavigation')}
            placement="right"
          >
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
                alignSelf: collapsed ? 'center' : 'stretch',
                justifyContent: collapsed ? 'center' : 'flex-start',
                minWidth: collapsed ? 44 : 0,
                minHeight: 44,
                mb: 1.5,
                px: collapsed ? 0 : 1.5,
                color: alpha.white[62],
                fontSize: 13,
                fontWeight: 600,
                textTransform: 'none',
                '& .MuiButton-startIcon': { ml: 0, mr: collapsed ? 0 : 1.25 },
                '&:hover': { bgcolor: alpha.white[8], color: surface.lightText },
              }}
            >
              {collapsed ? null : t('collapseMenu')}
            </Button>
          </Tooltip>
        ) : null}

        <Stack
          direction={collapsed ? 'column' : 'row'}
          spacing={1.3}
          alignItems="center"
          sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: alpha.white[8] }}
        >
          <ButtonBase
            aria-label={t('editProfile')}
            onClick={() => setProfileEditorOpen(true)}
            disabled={!session?.user?.id}
            sx={{
              display: 'flex',
              flexGrow: collapsed ? 0 : 1,
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1.3,
              minWidth: 0,
              borderRadius: `${radius.sm}px`,
              p: 0.5,
              '&:hover': { bgcolor: alpha.white[8] },
            }}
          >
            <Avatar
              src={session?.user?.image ?? undefined}
              alt={userName}
              sx={{
                width: 38,
                height: 38,
                bgcolor: 'primary.main',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {userInitials}
            </Avatar>
            <Box sx={{ display: collapsed ? 'none' : 'block', minWidth: 0, textAlign: 'left' }}>
              <Typography noWrap sx={{ fontSize: 13, fontWeight: 800 }}>
                {userName}
              </Typography>
              <Typography noWrap sx={{ color: alpha.white[56], fontSize: 10.5 }}>
                {userContext}
              </Typography>
            </Box>
          </ButtonBase>
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
  }

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
        {renderSidebar(sidebarCollapsed)}
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
          <DashboardNotificationsButton />
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
        PaperProps={{ sx: { width: sidebarExpandedWidth, border: 0 } }}
      >
        {renderSidebar(false, false)}
      </Drawer>

      {profileEditorOpen && session?.user?.id ? (
        <EditCurrentUserProfileDialog
          open={profileEditorOpen}
          user={{
            id: session.user.id,
            name: userName,
            email: session.user.email ?? '',
            avatarUrl: session.user.image ?? null,
          }}
          onClose={() => setProfileEditorOpen(false)}
          onUpdated={handleProfileUpdated}
        />
      ) : null}

      <Box
        component="main"
        sx={{
          width: {
            xs: '100%',
            md: `calc(100% - ${sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px)`,
          },
          minWidth: 0,
          ml: { md: `${sidebarCollapsed ? sidebarCollapsedWidth : sidebarExpandedWidth}px` },
          transition: 'margin-left 180ms ease, width 180ms ease',
          pt: { xs: '64px', md: 0 },
        }}
      >
        {isPublicCrmRoute || isLocalDashboardPreview ? (
          children
        ) : (
          <CrmAccessBoundary>{children}</CrmAccessBoundary>
        )}
      </Box>
    </Box>
  )
}
