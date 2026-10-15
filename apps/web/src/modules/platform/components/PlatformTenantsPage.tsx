'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { brand, radius } from '@shared/theme/tokens'

import { TenantsList } from './TenantsList'

export function PlatformTenantsPage() {
  const t = useTranslations('platform.tenants')

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={1.6}
        sx={{
          pb: 1.75,
          mb: 2.4,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          component="h1"
          sx={{
            color: brand.graphite[500],
            fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
            fontSize: { xs: 26, sm: 30 },
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {t('title')}
        </Typography>
        <Button
          component={Link}
          href="/platform/tenants/new"
          variant="contained"
          startIcon={<AddRoundedIcon />}
          sx={newTenantButtonSx}
        >
          {t('newTenant')}
        </Button>
      </Stack>
      <TenantsList />
    </Box>
  )
}

const newTenantButtonSx = {
  bgcolor: brand.magenta[500],
  borderRadius: `${radius.sm}px`,
  boxShadow: 'none',
  fontSize: 12,
  fontWeight: 800,
  height: { xs: 40, sm: 32 },
  width: { xs: '100%', md: 'auto' },
  px: 2.25,
  textTransform: 'none',
  whiteSpace: 'nowrap',
  '&:hover': { bgcolor: brand.magenta[600], boxShadow: 'none' },
}
