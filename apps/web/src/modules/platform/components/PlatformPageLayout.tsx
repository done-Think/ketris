'use client'

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { Box, Container, Stack } from '@mui/material'

import { Link } from '@/i18n/navigation'
import { DashboardPageHeader } from '@shared/components/layout'
import { brand, iconSize } from '@shared/theme/tokens'

import type { PlatformPageLayoutProps } from '../types/platform-shell'

export function PlatformPageLayout({
  title,
  subtitle,
  action,
  back,
  children,
}: PlatformPageLayoutProps) {
  return (
    <Container maxWidth={false} sx={{ p: 3.5 }}>
      <Stack spacing={2}>
        {back ? (
          <Box
            component={Link}
            href={back.href}
            sx={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.6,
              color: brand.neutral[500],
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              '&:hover': { color: brand.magenta[500] },
            }}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: iconSize.md }} />
            {back.label}
          </Box>
        ) : null}
        <DashboardPageHeader title={title} subtitle={subtitle} actions={action} />
        {children}
      </Stack>
    </Container>
  )
}
