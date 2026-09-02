import type { ReactNode } from 'react'

import { CrmShell } from '@modules/crm/components/CrmShell'

export default function CrmLayout({ children }: { children: ReactNode }) {
  return <CrmShell>{children}</CrmShell>
}
