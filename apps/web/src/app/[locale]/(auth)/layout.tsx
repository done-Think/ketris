import type { ReactNode } from 'react'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { authMessageNamespaces } from '@/i18n/message-selection'
import { privateMetadata } from '@/i18n/seo'

export const metadata = privateMetadata

export default function ScopedLayout({ children }: { children: ReactNode }) {
  return (
    <ScopedMessages namespaces={[...authMessageNamespaces, 'validation']}>
      {children}
    </ScopedMessages>
  )
}
