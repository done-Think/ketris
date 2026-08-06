import { RegistrationProfileStep, RegistrationShell } from '@modules/auth'

export const metadata = { title: 'Criar conta | Ketris' }

export default function CadastroPage() {
  return (
    <RegistrationShell currentStep={1} totalSteps={3}>
      <RegistrationProfileStep />
    </RegistrationShell>
  )
}
