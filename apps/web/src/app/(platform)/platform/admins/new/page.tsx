import { CreatePlatformAdminForm, PlatformPageLayout } from '@modules/platform'

export const metadata = { title: 'Administradores da plataforma — Ketris' }

export default function PlatformNewAdminPage() {
  return (
    <PlatformPageLayout title="Novo administrador da plataforma">
      <CreatePlatformAdminForm />
    </PlatformPageLayout>
  )
}
