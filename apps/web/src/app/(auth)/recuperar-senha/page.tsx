import Link from 'next/link'
import { Link as MuiLink } from '@mui/material'

import { AuthShell, PasswordRecoveryForm } from '@modules/auth'

export const metadata = { title: 'Recuperar senha | Ketris' }

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      brandDescription="Recupere o acesso à sua carteira de imóveis e clientes"
      contentMaxWidth={354}
      contentPaddingTop={7.5}
      mobileCard
      mobileLogoPlacement="backdrop"
      footer={
        <MuiLink
          component={Link}
          href="/login"
          underline="hover"
          sx={{ color: 'primary.main', fontSize: { xs: 10, md: 14 }, fontWeight: 700 }}
        >
          Voltar ao login
        </MuiLink>
      }
    >
      <PasswordRecoveryForm />
    </AuthShell>
  )
}
