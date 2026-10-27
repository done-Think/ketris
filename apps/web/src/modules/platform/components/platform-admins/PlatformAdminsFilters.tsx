'use client'

import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { InputAdornment, MenuItem, Select, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

import { styles } from '../../styles/platform-admins-page.styles'
import type { PlatformAdminsFiltersProps } from '../../types/platform-admin'
import { toPlatformAdminRoleFilter, toPlatformAdminStatusFilter } from '../../utils/platform-admins'

export function PlatformAdminsFilters({ filters, onChange }: PlatformAdminsFiltersProps) {
  const t = useTranslations('platform.admins')

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.2}>
      <TextField
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value, page: 1 })}
        placeholder={t('searchPlaceholder')}
        size="small"
        sx={styles.search}
        slotProps={{
          htmlInput: { 'aria-label': t('searchPlaceholder'), maxLength: 120 },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={styles.searchRoundedIcon} />
              </InputAdornment>
            ),
          },
        }}
      />
      <Select
        value={filters.status}
        onChange={(event) =>
          onChange({ status: toPlatformAdminStatusFilter(event.target.value), page: 1 })
        }
        inputProps={{ 'aria-label': t('statusFilter') }}
        sx={styles.filter}
      >
        <MenuItem value="all">{t('allStatuses')}</MenuItem>
        <MenuItem value="active">{t('active')}</MenuItem>
        <MenuItem value="inactive">{t('inactive')}</MenuItem>
      </Select>
      <Select
        value={filters.role}
        onChange={(event) =>
          onChange({ role: toPlatformAdminRoleFilter(event.target.value), page: 1 })
        }
        inputProps={{ 'aria-label': t('roleFilter') }}
        sx={styles.filter}
      >
        <MenuItem value="all">{t('allRoles')}</MenuItem>
        <MenuItem value="ADMIN">{t('roles.ADMIN')}</MenuItem>
        <MenuItem value="ADMIN_AGENT">{t('roles.ADMIN_AGENT')}</MenuItem>
        <MenuItem value="AGENT">{t('roles.AGENT')}</MenuItem>
      </Select>
    </Stack>
  )
}
