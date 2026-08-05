import { AuthStatusCard } from '@modules/auth'

export const metadata = { title: 'Criar conta | Ketris' }

export default function CadastroPage() {
  return (
    <AuthStatusCard
      title="Criar conta"
      description="O cadastro por perfil será a próxima etapa do fluxo de autenticação."
    />
  )
}
