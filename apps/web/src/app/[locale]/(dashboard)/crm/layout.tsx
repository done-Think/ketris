import type { ReactNode } from 'react'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { dashboardMessageNamespaces } from '@/i18n/message-selection'

import { AppShell } from '@shared/components/layout/AppShell'

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <ScopedMessages namespaces={[...dashboardMessageNamespaces, 'crm']}>
      <AppShell>{children}</AppShell>
    </ScopedMessages>
  )
}
