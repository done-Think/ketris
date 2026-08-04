import type { ReactNode } from 'react'
import { Box, Card, CardContent, Container, Stack, Typography } from '@mui/material'

import { AppLogo } from '@shared/components/ui'
import { radius, shadows } from '@shared/theme/tokens'

type AuthScreenLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthScreenLayout({ title, subtitle, children }: AuthScreenLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 6,
      }}
    >
      <Container maxWidth="xs">
        <Stack spacing={4} alignItems="center">
          <AppLogo src="/ketris-logo-transparent.png" width={140} />

          <Card sx={{ width: '100%', borderRadius: `${radius.lg}px`, boxShadow: shadows.popover }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={0.5} sx={{ mb: 3 }}>
                <Typography variant="h4">{title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              </Stack>

              {children}
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}
