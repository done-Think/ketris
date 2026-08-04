import { AuthScreenLayout } from '@modules/auth'
import { BootstrapPlatformAdminForm } from '@modules/platform'

export const metadata = { title: 'Configurar plataforma — Ketris' }

export default function PlatformSetupPage() {
  return (
    <AuthScreenLayout
      title="Configurar a plataforma"
      subtitle="Cria o primeiro administrador geral do Ketris."
    >
      <BootstrapPlatformAdminForm />
    </AuthScreenLayout>
  )
}
