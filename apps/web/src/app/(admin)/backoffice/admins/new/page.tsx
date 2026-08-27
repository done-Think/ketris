import { AuthScreenLayout, CreateAdminForm } from '@modules/auth'

export const metadata = { title: 'Ketris | Novo administrador Backoffice' }

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
