'use client'

import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { InputAdornment, Stack, TextField } from '@mui/material'
import { DashboardNotificationsButton, DashboardPageHeader } from '@shared/components/layout'
import { useListState } from '@shared/hooks/use-list-state'
import { useTranslations } from 'next-intl'
import { CrmProposalsList } from './CrmProposalsList'

export function ProposalsManagementPage() {
  const t = useTranslations('dashboard.proposals')
  const pipelineT = useTranslations('crm.pipeline')
  const { filters, setFilter } = useListState({ search: '' })
  return (
    <CrmProposalsList
      search={filters.search}
      header={
        <DashboardPageHeader
          title={t('title')}
          subtitle={t('subtitle')}
          actions={
            <Stack direction="row" spacing={1}>
              <TextField
                value={filters.search}
                onChange={(event) => setFilter('search', event.target.value)}
                size="small"
                placeholder={pipelineT('searchPlaceholder')}
                slotProps={{
                  htmlInput: { 'aria-label': pipelineT('searchAriaLabel') },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <DashboardNotificationsButton />
            </Stack>
          }
        />
      }
    />
  )
}
