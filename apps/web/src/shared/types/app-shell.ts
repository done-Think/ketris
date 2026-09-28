import type { ReactNode } from 'react'
import type { SvgIconComponent } from '@mui/icons-material'

import type { Papel } from '@server/auth/domain/user.entity'

export type AppShellNavHref =
  | '/dashboard'
  | '/dashboard/agency-overview'
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
  labelKey: string
  href: AppShellNavHref
  icon: SvgIconComponent
  roles?: readonly Papel[]
}

export type AppShellProps = {
  children: ReactNode
  allowLocalDashboardPreview?: boolean
}
