'use client'

import { useMemo, useState } from 'react'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { Box, Drawer, IconButton, Stack, Tooltip } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'
import { usePathname } from '@/i18n/navigation'
import { CrmAccessBoundary } from '@modules/crm/components/CrmAccessBoundary'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { AppLogo } from '@shared/components/ui'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'
import type { AppShellProps } from '@shared/types/app-shell'
import { getInitials } from '@shared/utils/get-initials'
import { useSidebarPreferencesStore } from '@shared/stores/sidebar-preferences-store'
import { appShellNavigationItems } from './app-shell-navigation-items'
import { AppShellSidebar, sidebarCollapsedWidth, sidebarExpandedWidth } from './AppShellSidebar'
import { DashboardNotificationsButton } from './DashboardNotificationsButton'

export function AppShell({ children, allowLocalDashboardPreview = false }: AppShellProps) {
  const t = useTranslations('common.appShell')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const sidebarCollapsed = useSidebarPreferencesStore((state) => state.isCollapsed)
  const toggleSidebarCollapsed = useSidebarPreferencesStore((state) => state.toggleCollapsed)
  const isPublicCrmRoute = pathname === '/crm' || pathname === '/crm/contacts'
  const isLocalDashboardPreview = allowLocalDashboardPreview
  const isPersonalProfileRoute =
    pathname === '/dashboard/profile' || pathname.startsWith('/dashboard/profile/')
  const userName = session?.user?.name ?? t('defaultUserName')
  const userContext = session?.user?.email ?? t('defaultUserContext')
  const userInitials = useMemo(() => getInitials(userName), [userName])
  const visibleItems = useMemo(() => {
    if (isLocalDashboardPreview) return appShellNavigationItems

    return appShellNavigationItems.filter(
      (item) => !item.roles || (session?.papel && item.roles.includes(session.papel)),
    )
  }, [isLocalDashboardPreview, session])
  const activeTargetPath = useMemo(() => {
    if (isPersonalProfileRoute) return null

    let bestMatch: string | null = null

    for (const item of visibleItems) {
      const targetPath = item.href.split('?')[0]
      const matches = pathname === targetPath || pathname.startsWith(`${targetPath}/`)

      if (matches && (!bestMatch || targetPath.length > bestMatch.length)) {
        bestMatch = targetPath
      }
    }

    return bestMatch
  }, [isPersonalProfileRoute, pathname, visibleItems])

  async function handleLogoutToMarketplace() {
    if (isSigningOut) return

    setIsSigningOut(true)
    setMobileOpen(false)
    await clearClientSession()
    router.replace(getLocalizedPathname('/', locale))
    router.refresh()
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
        <AppShellSidebar
          collapsed={sidebarCollapsed}
          showCollapseControl
          isLoading={status === 'loading'}
          visibleItems={visibleItems}
          activeTargetPath={activeTargetPath}
          userName={userName}
          userContext={userContext}
          userInitials={userInitials}
          userImage={session?.user?.image ?? undefined}
          canEditProfile={!!session?.user?.id}
          isPersonalProfileRoute={isPersonalProfileRoute}
          isSigningOut={isSigningOut}
          onNavItemClick={() => setMobileOpen(false)}
          onEditProfile={() => {
            setMobileOpen(false)
            router.push(getLocalizedPathname('/dashboard/profile', locale))
          }}
          onToggleCollapsed={toggleSidebarCollapsed}
          onLogoutToMarketplace={handleLogoutToMarketplace}
        />
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
        <AppShellSidebar
          collapsed={false}
          showCollapseControl={false}
          isLoading={status === 'loading'}
          visibleItems={visibleItems}
          activeTargetPath={activeTargetPath}
          userName={userName}
          userContext={userContext}
          userInitials={userInitials}
          userImage={session?.user?.image ?? undefined}
          canEditProfile={!!session?.user?.id}
          isPersonalProfileRoute={isPersonalProfileRoute}
          isSigningOut={isSigningOut}
          onNavItemClick={() => setMobileOpen(false)}
          onEditProfile={() => {
            setMobileOpen(false)
            router.push(getLocalizedPathname('/dashboard/profile', locale))
          }}
          onToggleCollapsed={toggleSidebarCollapsed}
          onLogoutToMarketplace={handleLogoutToMarketplace}
        />
      </Drawer>

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
        {isSigningOut || isPublicCrmRoute || isLocalDashboardPreview ? (
          children
        ) : (
          <CrmAccessBoundary>{children}</CrmAccessBoundary>
        )}
      </Box>
    </Box>
  )
}
