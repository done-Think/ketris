import type { ReactNode } from 'react'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { dashboardMessageNamespaces } from '@/i18n/message-selection'
import { privateMetadata } from '@/i18n/seo'

export const metadata = privateMetadata

export default function ScopedLayout({ children }: { children: ReactNode }) {
  return (
    <ScopedMessages namespaces={[...dashboardMessageNamespaces, 'contracts']}>
      {children}
    </ScopedMessages>
  )
}
