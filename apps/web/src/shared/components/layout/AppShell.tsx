'use client'

import { styles } from '@shared/styles/app-shell.styles'

import { useEffect, useMemo, useState } from 'react'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { Box, Drawer, IconButton, Stack, Tooltip } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { usePathname, useRouter } from '@/i18n/navigation'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { TenantSessionBoundary } from '@shared/components/layout/TenantSessionBoundary'
import { AppLogo } from '@shared/components/ui'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { getRestrictedRoleAccess } from '@shared/lib/auth/restricted-role-access'

import type { AppShellProps } from '@shared/types/app-shell'
import { getInitials } from '@shared/utils/get-initials'
import { useSidebarPreferencesStore } from '@shared/stores/sidebar-preferences-store'
import { useRetainedAuthContent } from '@shared/hooks/use-retained-auth-content'
import { appShellNavigationItems } from './app-shell-navigation-items'
import { AppShellSidebar } from './AppShellSidebar'
import { DashboardNotificationsButton } from './DashboardNotificationsButton'

export function AppShell({ children, allowLocalDashboardPreview = false }: AppShellProps) {
  const t = useTranslations('common.appShell')
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const restrictedAccess =
    session?.scope === 'tenant' ? getRestrictedRoleAccess(session.role) : null
  const isRenter = session?.scope === 'tenant' && session.role === 'RENTER'
  const retainRenterLayout = useRetainedAuthContent(
    isRenter,
    session?.authUnavailable === true,
    status === 'loading',
  )
  const isRestrictedRouteBlocked = Boolean(
    restrictedAccess && !restrictedAccess.isAllowedPathname(pathname),
  )
  useEffect(() => {
    if (restrictedAccess && isRestrictedRouteBlocked) {
      router.replace(restrictedAccess.home)
    }
  }, [restrictedAccess, isRestrictedRouteBlocked, router])
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
    if (restrictedAccess)
      return appShellNavigationItems.filter((item) =>
        restrictedAccess.navigationHrefs.includes(item.href),
      )
    if (isLocalDashboardPreview) return appShellNavigationItems

    return appShellNavigationItems.filter(
      (item) => !item.roles || (session?.role && item.roles.includes(session.role)),
    )
  }, [isLocalDashboardPreview, restrictedAccess, session])
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
    router.replace('/')
    router.refresh()
  }

  if (isRestrictedRouteBlocked) return null

  return (
    <Box sx={styles.box}>
      <Box sx={styles.box2(sidebarCollapsed)}>
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
          canEditProfile={!!session?.user?.id && (restrictedAccess?.canEditProfile ?? true)}
          isPersonalProfileRoute={isPersonalProfileRoute}
          isSigningOut={isSigningOut}
          onNavItemClick={() => setMobileOpen(false)}
          onEditProfile={() => {
            setMobileOpen(false)
            router.push('/dashboard/profile')
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
        sx={styles.stack}
      >
        <AppLogo src={ketrisLogoFooter} width={42} sx={styles.appLogo} />
        <Stack direction="row" alignItems="center" spacing={1}>
          <DashboardNotificationsButton placement="navigationHeader" />
          <Tooltip title={t('openNavigation')}>
            <IconButton
              aria-label={t('openNavigation')}
              onClick={() => setMobileOpen(true)}
              sx={styles.iconButton}
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
        PaperProps={{ sx: styles.paper }}
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
          canEditProfile={!!session?.user?.id && (restrictedAccess?.canEditProfile ?? true)}
          isPersonalProfileRoute={isPersonalProfileRoute}
          isSigningOut={isSigningOut}
          onNavItemClick={() => setMobileOpen(false)}
          onEditProfile={() => {
            setMobileOpen(false)
            router.push('/dashboard/profile')
          }}
          onToggleCollapsed={toggleSidebarCollapsed}
          onLogoutToMarketplace={handleLogoutToMarketplace}
        />
      </Drawer>

      <Box component="main" sx={styles.box3(sidebarCollapsed)}>
        {retainRenterLayout || isSigningOut || isPublicCrmRoute || isLocalDashboardPreview ? (
          children
        ) : (
          <TenantSessionBoundary>{children}</TenantSessionBoundary>
        )}
      </Box>
    </Box>
  )
}
