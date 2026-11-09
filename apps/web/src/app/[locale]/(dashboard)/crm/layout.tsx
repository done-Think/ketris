import { requireDashboardFeature } from '@shared/lib/auth/require-dashboard-feature'
import type { ReactNode } from 'react'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { dashboardMessageNamespaces } from '@/i18n/message-selection'

import { AppShell } from '@shared/components/layout/AppShell'

export default async function CrmLayout({ children }: { children: ReactNode }) {
  await requireDashboardFeature('pipeline')
  return (
    <ScopedMessages namespaces={[...dashboardMessageNamespaces, 'crm']}>
      <AppShell>{children}</AppShell>
    </ScopedMessages>
  )
}
