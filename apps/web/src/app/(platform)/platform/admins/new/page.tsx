import { CreatePlatformAdminForm, PlatformPageLayout } from '@modules/platform'

export const metadata = { title: 'Ketris | Administradores da plataforma' }

export default function PlatformNewAdminPage() {
  return (
    <PlatformPageLayout title="Novo administrador da plataforma">
      <CreatePlatformAdminForm />
    </PlatformPageLayout>
  )
}
