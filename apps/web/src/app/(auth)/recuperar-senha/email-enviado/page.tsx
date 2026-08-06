import Link from 'next/link'
import { Link as MuiLink } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'

import { AuthShell, PasswordRecoveryConfirmation } from '@modules/auth'
import { surface } from '@shared/theme/tokens'

export const metadata = { title: 'E-mail enviado | Ketris' }

export default function EmailEnviadoPage() {
  return (
    <AuthShell
      brandDescription="Enviamos um link de recuperação para seu e-mail cadastrado"
      contentMaxWidth={354}
      contentPaddingTop={6.5}
      mobileCard
      mobileLogoPlacement="backdrop"
      footer={
        <MuiLink
          component={Link}
          href="/recuperar-senha"
          underline="hover"
          sx={{
            color: { xs: muiAlpha(surface.lightText, 0.36), md: 'text.secondary' },
            fontSize: { xs: 10, md: 13 },
            fontWeight: 700,
          }}
        >
          Reenviar e-mail
        </MuiLink>
      }
    >
      <PasswordRecoveryConfirmation />
    </AuthShell>
  )
}
