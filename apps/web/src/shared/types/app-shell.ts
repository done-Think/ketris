import type { ReactNode } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'
import type { TranslationKey } from '@/i18n/types/messages.types'

import type { UserRole } from '@shared/types/user-role'

export type AppShellNavHref =
  | '/dashboard'
  | '/crm'
  | '/crm/contacts'
  | '/dashboard/leads'
  | '/dashboard/team'
  | '/dashboard/properties'
  | '/dashboard/contracts'
  | '/dashboard/public-profile'
  | '/dashboard/public-profile/agency'
  | '/dashboard/agenda'
  | '/dashboard/finance'
  | '/dashboard/finance/charges'
  | '/dashboard/maintenance'

export type AppShellNavItem = {
  labelKey: TranslationKey<'common.appShell'>
  href: AppShellNavHref
  icon: SvgIconComponent
  roles?: readonly UserRole[]
}

export type AppShellProps = {
  children: ReactNode
  allowLocalDashboardPreview?: boolean
}

export type LogoutTransitionProps = {
  hasError: boolean
  onRetry: () => void
}

export type AppShellSidebarProps = {
  collapsed: boolean
  showCollapseControl: boolean
  isLoading: boolean
  visibleItems: readonly AppShellNavItem[]
  activeTargetPath: string | null
  userName: string
  userContext: string
  userInitials: string
  userImage?: string
  canEditProfile: boolean
  isPersonalProfileRoute: boolean
  isSigningOut: boolean
  onNavItemClick: () => void
  onEditProfile: () => void
  onToggleCollapsed: () => void
  onLogoutToMarketplace: () => void
}
