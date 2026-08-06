import { AuthScreenLayout, BootstrapAdminForm } from '@modules/auth'

export const metadata = { title: 'Configurar administrador — Ketris Backoffice' }

export default function BackofficeSetupPage() {
  return (
    <AuthScreenLayout
      title="Primeiro acesso"
      subtitle="Crie o administrador inicial de um tenant que ainda não tem nenhum."
    >
      <BootstrapAdminForm />
    </AuthScreenLayout>
  )
}
