import Link from 'next/link'
import { Link as MuiLink } from '@mui/material'

import { AuthShell, PasswordRecoveryConfirmation } from '@modules/auth'

export const metadata = { title: 'E-mail enviado | Ketris' }

export default function EmailEnviadoPage() {
  return (
    <AuthShell
      brandDescription="Enviamos um link de recuperação para seu e-mail cadastrado"
      contentMaxWidth={354}
      contentPaddingTop={6.5}
      footer={
        <MuiLink
          component={Link}
          href="/recuperar-senha"
          underline="hover"
          sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}
        >
          Reenviar e-mail
        </MuiLink>
      }
    >
      <PasswordRecoveryConfirmation />
    </AuthShell>
  )
}
