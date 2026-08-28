import type { ReactNode } from 'react'

import { requirePlatformSession } from '@shared/lib/auth/require-platform-session'

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await requirePlatformSession()

  return children
}
