import type { ReactNode } from 'react'
import { Container, Stack } from '@mui/material'

import { SectionHeader } from '@shared/components/ui'

type PlatformPageLayoutProps = {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function PlatformPageLayout({ title, action, children }: PlatformPageLayoutProps) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <SectionHeader title={title} action={action} />
        {children}
      </Stack>
    </Container>
  )
}
