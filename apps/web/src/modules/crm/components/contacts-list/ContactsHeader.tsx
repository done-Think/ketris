import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, InputAdornment, Stack, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import * as crmStyles from '../../styles/contacts-header.styles'

import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'

import type { ContactsHeaderProps } from '../../types/contact'

export function ContactsHeader({ search, onSearchChange, onNewContact }: ContactsHeaderProps) {
  const t = useTranslations('crm.contacts')

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
        disabled={!onNewContact}
        onClick={onNewContact}
        sx={crmStyles.dashboardHeaderActionButtonSx}
      >
        {t('newContact')}
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
