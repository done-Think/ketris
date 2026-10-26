import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, InputAdornment, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/leads-header.styles'

import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'

import type { LeadsHeaderProps } from '../../types/lead'

export function LeadsHeader({ search, onSearchChange, onNewLead }: LeadsHeaderProps) {
  const t = useTranslations('crm.leads')

  const actions = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={crmStyles.stackSx}>
      <TextField
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('searchPlaceholder')}
        size="small"
        sx={crmStyles.textFieldSx}
        slotProps={{
          htmlInput: { 'aria-label': t('searchAriaLabel') },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={crmStyles.searchRoundedIconSx} />
              </InputAdornment>
            ),
          },
        }}
      />
      <DashboardHeaderActionButton
        startIcon={<AddRoundedIcon sx={crmStyles.addRoundedIconSx} />}
        disabled={!onNewLead}
        onClick={onNewLead}
        sx={crmStyles.dashboardHeaderActionButtonSx}
      >
        {t('newLead')}
      </DashboardHeaderActionButton>
      <Box sx={crmStyles.boxSx}>
        <DashboardNotificationsButton />
      </Box>
    </Stack>
  )

  return (
    <DashboardPageHeader
      title={t('title')}
      subtitle={t('subtitle')}
      actions={actions}
      sx={crmStyles.dashboardPageHeaderSx}
    />
  )
}
