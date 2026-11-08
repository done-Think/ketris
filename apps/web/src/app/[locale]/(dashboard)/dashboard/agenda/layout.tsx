import { requireDashboardFeature } from '@shared/lib/auth/require-dashboard-feature'
import type { ReactNode } from 'react'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { dashboardMessageNamespaces } from '@/i18n/message-selection'
import { privateMetadata } from '@/i18n/seo'

export const metadata = privateMetadata

export default async function ScopedLayout({ children }: { children: ReactNode }) {
  await requireDashboardFeature('agenda')
  return (
    <ScopedMessages namespaces={[...dashboardMessageNamespaces, 'agenda']}>
      {children}
    </ScopedMessages>
  )
}
