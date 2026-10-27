'use client'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Box, Container, Stack } from '@mui/material'

import { Link } from '@/i18n/navigation'
import { DashboardPageHeader } from '@shared/components/layout'

import type { PlatformPageLayoutProps } from '../types/platform-shell'
import { styles } from '../styles/platform-page-layout.styles'

export function PlatformPageLayout({
  title,
  subtitle,
  action,
  back,
  children,
}: PlatformPageLayoutProps) {
  return (
    <Container maxWidth={false} sx={styles.container}>
      <Stack spacing={2}>
        {back ? (
          <Box component={Link} href={back.href} sx={styles.box}>
            <ArrowBackRoundedIcon sx={styles.arrowBackRoundedIcon} />
            {back.label}
          </Box>
        ) : null}
        <DashboardPageHeader title={title} subtitle={subtitle} actions={action} />
        {children}
      </Stack>
    </Container>
  )
}
