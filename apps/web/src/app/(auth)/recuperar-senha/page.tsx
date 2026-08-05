import { AuthShell, AuthStatusCard } from '@modules/auth'

export const metadata = { title: 'Recuperar senha | Ketris' }

export default function RecuperarSenhaPage() {
  return (
    <AuthShell>
      <AuthStatusCard
        title="Recuperar senha"
        description="A recuperação por e-mail será conectada quando o serviço de envio estiver definido."
      />
    </AuthShell>
  )
}
