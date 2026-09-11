import type { ReactNode } from 'react'

import { DashboardRouteShell } from '@modules/dashboard'

export default function DashboardSectionLayout({ children }: { children: ReactNode }) {
  return <DashboardRouteShell>{children}</DashboardRouteShell>
}
