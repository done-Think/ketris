'use client'

import type { ReactNode } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'
import { useSession } from 'next-auth/react'

import { alpha, radius, surface } from '@shared/theme/tokens'

type CrmAccessBoundaryProps = {
  children: ReactNode
}

export function CrmAccessBoundary({ children }: CrmAccessBoundaryProps) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '55vh' }}>
        <CircularProgress size={30} aria-label="Carregando sessão" />
      </Stack>
    )
  }

  if (status !== 'authenticated' || session?.scope !== 'tenant' || !session.tenantId) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{ minHeight: '55vh', textAlign: 'center' }}
      >
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 52,
            height: 52,
            borderRadius: `${radius.md}px`,
            bgcolor: alpha.magenta[10],
            color: 'primary.main',
          }}
        >
          <LockOutlinedIcon />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ mb: 0.5 }}>
            Acesso restrito ao CRM
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 430 }}>
            Entre com uma conta vinculada a um tenant para visualizar as oportunidades.
          </Typography>
        </Box>
        <Button component={NextLink} href="/login" variant="contained">
          Entrar no Ketris
        </Button>
      </Stack>
    )
  }

  return <Box sx={{ minHeight: '100%', bgcolor: surface.app }}>{children}</Box>
}
