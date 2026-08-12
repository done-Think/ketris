import { Divider, Stack, Typography } from '@mui/material'

import { CreateTenantAdminForm, PlatformPageLayout, TenantUsersList } from '@modules/platform'

export const metadata = { title: 'Imobiliária — Ketris Plataforma' }

interface PlatformTenantPageProps {
  params: { id: string }
}

export default function PlatformTenantPage({ params }: PlatformTenantPageProps) {
  return (
    <PlatformPageLayout title="Usuários da imobiliária">
      <Stack spacing={4}>
        <TenantUsersList tenantId={params.id} />

        <Divider />

        <Stack spacing={2}>
          <Typography variant="h6">Novo administrador</Typography>
          <CreateTenantAdminForm tenantId={params.id} />
        </Stack>
      </Stack>
    </PlatformPageLayout>
  )
}
