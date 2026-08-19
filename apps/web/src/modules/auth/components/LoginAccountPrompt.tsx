import Link from 'next/link'
import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'

import { componentText, surface } from '@shared/theme/tokens'

import { authRoutes } from '../config/auth-routes'

export function LoginAccountPrompt() {
  return (
    <Stack direction="row" justifyContent="center" spacing={0.5} alignItems="center">
      <Typography
        variant="body2"
        sx={{
          color: { xs: muiAlpha(surface.lightText, 0.72), md: 'text.secondary' },
          ...componentText.authPrompt,
        }}
      >
        Não tem conta?
      </Typography>
      <MuiLink
        component={Link}
        href={authRoutes.register}
        underline="hover"
        sx={{ color: 'primary.main', ...componentText.authPrompt, fontWeight: 700 }}
      >
        Criar conta
      </MuiLink>
    </Stack>
  )
}
