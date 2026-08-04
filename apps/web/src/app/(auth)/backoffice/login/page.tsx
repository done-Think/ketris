import { AuthScreenLayout, SignInForm } from '@modules/auth'

export const metadata = { title: 'Entrar — Ketris Backoffice' }

export default function BackofficeSignInPage() {
  return (
    <AuthScreenLayout
      title="Acesso administrativo"
      subtitle="Entre com sua conta de administrador do Ketris."
    >
      <SignInForm />
    </AuthScreenLayout>
  )
}
