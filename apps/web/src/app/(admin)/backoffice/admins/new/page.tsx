import { AuthScreenLayout, CreateAdminForm } from '@modules/auth'

export const metadata = { title: 'Novo administrador — Ketris Backoffice' }

export default function BackofficeNovoAdministradorPage() {
  return (
    <AuthScreenLayout
      title="Novo administrador"
      subtitle="Cria uma conta com acesso administrativo total ao tenant."
    >
      <CreateAdminForm />
    </AuthScreenLayout>
  )
}
