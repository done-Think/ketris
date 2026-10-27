'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import { Box, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { DashboardHeaderActionButton } from '@shared/components/layout'

import { usePlatformActor } from '../hooks/use-platform-actor'
import { TenantsFilters, TenantsList } from './TenantsList'
import type { TenantTypeFilter } from '../types/tenant'
import { styles } from '../styles/platform-tenants-page.styles'

export function PlatformTenantsPage() {
  const t = useTranslations('platform.tenants')
  const [query, setQuery] = useState('')
  const [accountType, setAccountType] = useState<TenantTypeFilter>('ALL')
  const { canManage } = usePlatformActor()

  return (
    <Box sx={styles.box}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        alignItems={{ lg: 'center' }}
        spacing={1.6}
        sx={styles.stack}
      >
        <Box>
          <Typography component="h1" sx={styles.typography}>
            {t('title')}
          </Typography>
          <Typography sx={styles.typography2}>{t('subtitle')}</Typography>
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.2}
          alignItems={{ sm: 'center' }}
          sx={styles.stack2}
        >
          <TenantsFilters
            query={query}
            accountType={accountType}
            onQueryChange={setQuery}
            onAccountTypeChange={setAccountType}
          />
          {canManage ? (
            <DashboardHeaderActionButton
              component={Link}
              href="/platform/tenants/new"
              startIcon={<AddRoundedIcon />}
            >
              {t('newTenant')}
            </DashboardHeaderActionButton>
          ) : null}
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
