'use client'

import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { Box, Button, InputAdornment, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'

import { RhfTextField } from '@shared/components/form'
import { DashboardNotificationsButton } from '@shared/components/layout'
import { brand, iconSize, radius, surface } from '@shared/theme/tokens'

import { useLeadsStore } from '../stores/leads-store'
import type { DashboardLead, LeadsDashboardFiltersFormValues } from '../types/lead'
import { filterLeads } from '../utils/lead-dashboard'
import { CreateLeadDialog } from './CreateLeadDialog'
import { LeadContactDialog } from './LeadContactDialog'
import { LeadsDesktopTable } from './LeadsDesktopTable'
import { LeadsFilterBar } from './LeadsFilterBar'
import { LeadsMobileList } from './LeadsMobileList'

export function LeadsDashboardPage() {
  const t = useTranslations('crm.leads')
  const searchParams = useSearchParams()
  const leads = useLeadsStore((state) => state.leads)
  const [isCreateLeadDialogOpen, setIsCreateLeadDialogOpen] = useState(false)
  const [selectedContactLead, setSelectedContactLead] = useState<DashboardLead | null>(null)
  const { control, setValue } = useForm<LeadsDashboardFiltersFormValues>({
    defaultValues: {
      activeFilter: 'Todos',
      searchQuery: '',
    },
  })
  const activeFilter = useWatch({ control, name: 'activeFilter' })
  const searchQuery = useWatch({ control, name: 'searchQuery' })
  const filteredLeads = useMemo(
    () => filterLeads(leads, searchQuery, activeFilter),
    [activeFilter, leads, searchQuery],
  )

  useEffect(() => {
    const leadId = searchParams.get('leadId')
    const lead = leads.find((currentLead) => currentLead.id === leadId)
    if (!lead) return

    setSelectedContactLead(lead)
  }, [leads, searchParams])

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 3.6 }, py: { xs: 2.4, md: 4.2 } }}>
      <Stack spacing={2.2}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          alignItems={{ xs: 'stretch', lg: 'flex-start' }}
          justifyContent="space-between"
          spacing={1.6}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h3"
              sx={{ color: brand.graphite[500], fontSize: { xs: 30, md: 40 }, fontWeight: 900 }}
            >
              {t('title')}
            </Typography>
            <Typography sx={{ color: brand.neutral[500], fontSize: { xs: 14, md: 15 } }}>
              {t('subtitle')}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.2}
            sx={{ width: { xs: '100%', lg: 'auto' } }}
          >
            <RhfTextField
              control={control}
              name="searchQuery"
              placeholder={t('searchPlaceholder')}
              size="small"
              sx={{
                width: { xs: '100%', sm: 320 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: surface.paper,
                  borderRadius: `${radius.sm}px`,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: brand.neutral[400], fontSize: iconSize.md }} />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
              <Button
                type="button"
                variant="contained"
                startIcon={<AddRoundedIcon sx={{ fontSize: iconSize.sm }} />}
                onClick={() => setIsCreateLeadDialogOpen(true)}
                sx={{
                  flex: { xs: 1, sm: 'initial' },
                  minHeight: 40,
                  borderRadius: `${radius.sm}px`,
                  fontWeight: 900,
                }}
              >
                {t('newLead')}
              </Button>
              <DashboardNotificationsButton />
            </Stack>
          </Stack>
        </Stack>
        <LeadsFilterBar
          activeFilter={activeFilter}
          leads={leads}
          onFilterChange={(filter) => setValue('activeFilter', filter)}
        />
        <LeadsDesktopTable
          leads={filteredLeads}
          totalCount={leads.length}
          onLeadContactSelect={setSelectedContactLead}
        />
        <LeadsMobileList leads={filteredLeads} onLeadContactSelect={setSelectedContactLead} />{' '}
      </Stack>
      <CreateLeadDialog
        open={isCreateLeadDialogOpen}
        onClose={() => setIsCreateLeadDialogOpen(false)}
      />
      <LeadContactDialog
        lead={selectedContactLead}
        open={Boolean(selectedContactLead)}
        onClose={() => setSelectedContactLead(null)}
      />
    </Box>
  )
}
