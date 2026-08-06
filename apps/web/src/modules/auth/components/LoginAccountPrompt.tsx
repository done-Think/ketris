import Link from 'next/link'
import { Link as MuiLink, Stack, Typography } from '@mui/material'
import { alpha as muiAlpha } from '@mui/material/styles'

import { surface } from '@shared/theme/tokens'

export function LoginAccountPrompt() {
  return (
    <Stack direction="row" justifyContent="center" spacing={0.5} alignItems="center">
      <Typography
        variant="body2"
        sx={{
          color: { xs: muiAlpha(surface.lightText, 0.72), md: 'text.secondary' },
          fontSize: { xs: 11, md: 14 },
        }}
      >
        Não tem conta?
      </Typography>
      <MuiLink
        component={Link}
        href="/cadastro"
        underline="hover"
        sx={{ color: 'primary.main', fontSize: { xs: 11, md: 14 }, fontWeight: 700 }}
      >
        Criar conta
      </MuiLink>
    </Stack>
  )
}
