import Link from 'next/link'
import { Link as MuiLink } from '@mui/material'

import { AuthStandaloneShell, PasswordRecoveryForm } from '@modules/auth'

export const metadata = { title: 'Recuperar senha | Ketris' }

export default function RecuperarSenhaPage() {
  return (
    <AuthStandaloneShell
      footer={
        <MuiLink
          component={Link}
          href="/login"
          underline="hover"
          sx={{ color: 'primary.main', fontSize: 14, fontWeight: 700 }}
        >
          Voltar ao login
        </MuiLink>
      }
    >
      <PasswordRecoveryForm />
    </AuthStandaloneShell>
  )
}
