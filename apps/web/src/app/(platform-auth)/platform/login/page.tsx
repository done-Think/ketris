import { AuthScreenLayout } from '@modules/auth'
import { PlatformSignInForm } from '@modules/platform'

export const metadata = { title: 'Entrar — Ketris Plataforma' }

export default function PlatformLoginPage() {
  return (
    <AuthScreenLayout
      title="Administração da plataforma"
      subtitle="Entre com sua conta de administrador geral do Ketris."
    >
      <PlatformSignInForm />
    </AuthScreenLayout>
  )
}
