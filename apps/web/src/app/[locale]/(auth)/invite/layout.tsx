import type { ReactNode } from 'react'

import { ScopedMessages } from '@/i18n/scoped-messages'

export default function InvitationLayout({ children }: { children: ReactNode }) {
  return (
    <ScopedMessages namespaces={['auth.brand', 'dashboard.team.invitationPage']}>
      {children}
    </ScopedMessages>
  )
}
