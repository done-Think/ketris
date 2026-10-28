import type { ReactNode } from 'react'

import { ScopedMessages } from '@/i18n/scoped-messages'
import { publicMessageNamespaces } from '@/i18n/message-selection'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <ScopedMessages namespaces={publicMessageNamespaces}>{children}</ScopedMessages>
}
