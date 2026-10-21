'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { DashboardHeaderActionButton } from '@shared/components/layout'
import { brand } from '@shared/theme/tokens'

import { TenantsFilters, TenantsList, type TenantTypeFilter } from './TenantsList'

export function PlatformTenantsPage() {
  const t = useTranslations('platform.tenants')
  const [query, setQuery] = useState('')
  const [accountType, setAccountType] = useState<TenantTypeFilter>('ALL')

  return (
    <Box sx={{ width: '100%', p: 3.5 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        alignItems={{ lg: 'center' }}
        spacing={1.6}
        sx={{
          pb: 1.75,
          mb: 2.4,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
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
          <Typography sx={{ color: brand.neutral[500], fontSize: 14, mt: 0.5 }}>
            {t('subtitle')}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.2}
          alignItems={{ sm: 'center' }}
          sx={{ width: { xs: '100%', lg: 'auto' } }}
        >
          <TenantsFilters
            query={query}
            accountType={accountType}
            onQueryChange={setQuery}
            onAccountTypeChange={setAccountType}
          />
          <DashboardHeaderActionButton
            component={Link}
            href="/platform/tenants/new"
            startIcon={<AddRoundedIcon />}
          >
            {t('newTenant')}
          </DashboardHeaderActionButton>
        </Stack>
      </Stack>
      <TenantsList
        filters={{
          query,
          accountType,
          onClear: () => {
            setQuery('')
            setAccountType('ALL')
          },
        }}
      />
    </Box>
  )
}
