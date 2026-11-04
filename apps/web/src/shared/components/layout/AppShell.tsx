'use client'

import { styles } from '@shared/styles/app-shell.styles'

import { useEffect, useMemo, useRef, useState } from 'react'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import { Box, Drawer, IconButton, Stack, Tooltip } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'

import { usePathname, useRouter } from '@/i18n/navigation'
import ketrisLogoFooter from '@shared/assets/ketris-logo-footer.png'
import { TenantSessionBoundary } from '@shared/components/layout/TenantSessionBoundary'
import { AppLogo } from '@shared/components/ui'
import { clearClientSession } from '@shared/lib/auth/clear-client-session'
import { LogoutToMarketplaceContext } from '@shared/lib/auth/logout-to-marketplace-context'
import { getRestrictedRoleAccess } from '@shared/lib/auth/restricted-role-access'

import type { AppShellProps } from '@shared/types/app-shell'
import { getInitials } from '@shared/utils/get-initials'
import { useSidebarPreferencesStore } from '@shared/stores/sidebar-preferences-store'
import { useRetainedAuthContent } from '@shared/hooks/use-retained-auth-content'
import { useFaceCheckNavigation } from '@shared/hooks/use-face-check-navigation'
import { appShellNavigationItems } from './app-shell-navigation-items'
import { AppShellSidebar } from './AppShellSidebar'
import { DashboardNotificationsButton } from './DashboardNotificationsButton'
import { LogoutTransition } from './LogoutTransition'

export function AppShell({ children, allowLocalDashboardPreview = false }: AppShellProps) {
  const t = useTranslations('common.appShell')
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const faceCheckAccess = useFaceCheckNavigation()
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutFailed, setSignOutFailed] = useState(false)
  const logoutPending = useRef(false)
  useEffect(() => {
    if (!isSigningOut && restrictedAccess && isRestrictedRouteBlocked) {
      router.replace(restrictedAccess.home)
    }
  }, [restrictedAccess, isRestrictedRouteBlocked, isSigningOut, router])
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
    const available = appShellNavigationItems.filter(
      (item) =>
        (item.href !== '/dashboard/face_check' || faceCheckAccess.canManage) &&
        (item.href !== '/dashboard/face_check/my-verifications' || faceCheckAccess.hasRequests),
    )
    if (restrictedAccess)
      return available.filter((item) => restrictedAccess.navigationHrefs.includes(item.href))
    if (isLocalDashboardPreview) return appShellNavigationItems

    return available.filter(
      (item) => !item.roles || (session?.role && item.roles.includes(session.role)),
    )
  }, [
    isLocalDashboardPreview,
    restrictedAccess,
    session,
    faceCheckAccess.canManage,
    faceCheckAccess.hasRequests,
  ])
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
    if (logoutPending.current) return
    logoutPending.current = true
    setIsSigningOut(true)
    setSignOutFailed(false)
    setMobileOpen(false)
    try {
      await clearClientSession()
      router.replace('/')
    } catch {
      logoutPending.current = false
      setSignOutFailed(true)
    }
  }

  if (isSigningOut)
    return (
      <LogoutTransition hasError={signOutFailed} onRetry={() => void handleLogoutToMarketplace()} />
    )
  if (isRestrictedRouteBlocked) return null

  return (
    <LogoutToMarketplaceContext.Provider value={handleLogoutToMarketplace}>
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
          {retainRenterLayout || isPublicCrmRoute || isLocalDashboardPreview ? (
            children
          ) : (
            <TenantSessionBoundary>{children}</TenantSessionBoundary>
          )}
        </Box>
      </Box>
    </LogoutToMarketplaceContext.Provider>
  )
}
