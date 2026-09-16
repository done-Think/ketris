'use client'

import { useEffect, useMemo, useState } from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { brand, radius, shadows, surface } from '@shared/theme/tokens'

import type { DashboardLead, LeadFilter } from '../types/lead'
import { filterLeads, leadsDefaultPageSize, paginateLeads } from '../utils/leads'
import { useLeadsStore } from '../stores/leads-store'
import { CreateLeadDialog } from './CreateLeadDialog'
import { LeadContactDialog } from './LeadContactDialog'
import { LeadsCards } from './leads-list/LeadsCards'
import { LeadsHeader } from './leads-list/LeadsHeader'
import { LeadsPaginationFooter } from './leads-list/LeadsPaginationFooter'
import { LeadsStatusFilters } from './leads-list/LeadsStatusFilters'
import { LeadsTable } from './leads-list/LeadsTable'

const leadsBodyFontFamily = 'var(--font-inter), system-ui, -apple-system, sans-serif'

export function LeadsDashboardPage() {
  const t = useTranslations('crm.leads')
  const searchParams = useSearchParams()
  const leads = useLeadsStore((state) => state.leads)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<LeadFilter>('Todos')
  const [page, setPage] = useState(1)
  const [isCreateLeadDialogOpen, setIsCreateLeadDialogOpen] = useState(false)
  const [selectedContactLead, setSelectedContactLead] = useState<DashboardLead | null>(null)

  const filteredLeads = useMemo(
    () => filterLeads(leads, search, activeFilter),
    [search, activeFilter, leads],
  )
  const leadsPage = useMemo(
    () => paginateLeads(filteredLeads, page, leadsDefaultPageSize),
    [filteredLeads, page],
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleFilterChange(filter: LeadFilter) {
    setActiveFilter(filter)
    setPage(1)
  }

  useEffect(() => {
    const leadId = searchParams.get('leadId')
    const lead = leads.find((currentLead) => currentLead.id === leadId)
    if (!lead) return

    setSelectedContactLead(lead)
  }, [leads, searchParams])

  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 2, md: 3.6 },
        py: { xs: 2.4, md: 4.2 },
        fontFamily: leadsBodyFontFamily,
        '& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiTableCell-root': {
          fontFamily: leadsBodyFontFamily,
        },
      }}
    >
      <Stack spacing={2.2}>
        <LeadsHeader
          search={search}
          onSearchChange={handleSearchChange}
          onNewLead={() => setIsCreateLeadDialogOpen(true)}
        />

        <LeadsStatusFilters
          activeFilter={activeFilter}
          leads={leads}
          onFilterChange={handleFilterChange}
        />

        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: { xs: 420, md: 360 },
            overflow: 'hidden',
            borderColor: brand.neutral[100],
            borderRadius: `${radius.lg}px`,
            bgcolor: surface.paper,
            boxShadow: shadows.crmListPanel,
          }}
        >
          {leadsPage.items.length > 0 ? (
            <>
              <LeadsTable leads={leadsPage.items} onContactLead={setSelectedContactLead} />
              <LeadsCards leads={leadsPage.items} onContactLead={setSelectedContactLead} />
            </>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 240, px: 2 }}>
              <Typography sx={{ color: 'text.secondary', fontSize: 12.5 }}>{t('empty')}</Typography>
            </Stack>
          )}

          <LeadsPaginationFooter
            firstVisible={leadsPage.firstItem}
            lastVisible={leadsPage.lastItem}
            resultTotal={leadsPage.totalCount}
            page={leadsPage.page}
            pageCount={leadsPage.pageCount}
            onPageChange={setPage}
          />
        </Paper>
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
