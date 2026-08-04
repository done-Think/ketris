import type { ReactNode } from 'react'

import { requireAdminSession } from '@shared/lib/auth/require-admin-session'

export default async function BackofficeAdministradoresLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdminSession()

  return children
}
