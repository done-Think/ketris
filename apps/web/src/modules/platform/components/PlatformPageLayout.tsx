import { Container, Stack } from '@mui/material'

import { DashboardPageHeader } from '@shared/components/layout'

import type { PlatformPageLayoutProps } from '../types/platform-shell'

export function PlatformPageLayout({ title, action, children }: PlatformPageLayoutProps) {
  return (
    <Container maxWidth={false} sx={{ p: 3.5 }}>
      <Stack spacing={2}>
        <DashboardPageHeader title={title} actions={action} />
        {children}
      </Stack>
    </Container>
  )
}
