import type { ReactNode } from 'react'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { privateMetadata } from '@/i18n/seo'

export const metadata = privateMetadata

export default function ScopedLayout({ children }: { children: ReactNode }) {
  return (
    <ScopedMessages
      namespaces={['platform', 'auth', 'validation', 'marketplace.header', 'marketplace.profile']}
    >
      {children}
    </ScopedMessages>
  )
}
