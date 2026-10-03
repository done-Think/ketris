import type { ReactNode } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'

export type NavigationItem = {
  label: 'overview' | 'tenants' | 'users' | 'plans' | 'finance' | 'system' | 'logs'
  icon: SvgIconComponent
  href?: '/platform' | '/platform/tenants' | '/platform/system' | '/platform/admins/new'
}

export type PlatformShellProps = {
  children: ReactNode
}

export type PlatformPageLayoutProps = {
  title: string
  action?: ReactNode
  children: ReactNode
}
