import { Stack } from '@mui/material'

import { ActionTextLink } from '@shared/components/ui'
import { PlatformPageLayout, TenantsList } from '@modules/platform'

export const metadata = { title: 'Imobiliárias — Ketris Plataforma' }

export default function PlatformDashboardPage() {
  return (
    <PlatformPageLayout
      title="Imobiliárias"
      action={
        <Stack direction="row" spacing={2}>
          <ActionTextLink href="/platform/admins/new">Administradores da plataforma</ActionTextLink>
          <ActionTextLink href="/platform/tenants/new">Nova imobiliária</ActionTextLink>
        </Stack>
      }
    >
      <TenantsList />
    </PlatformPageLayout>
  )
}
