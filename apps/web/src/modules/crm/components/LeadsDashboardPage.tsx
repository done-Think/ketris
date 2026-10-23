'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'
import { useSearchParams } from 'next/navigation'

import { getLeadListFixtures } from '../fixtures/lead-list-fixtures'
import { useLeads, useUpdateLeadStage } from '../hooks/use-leads'
import type {
  DashboardLead,
  LeadApiStage,
  LeadFilter,
  LeadTableSortField,
  LeadTableSortState,
} from '../types/lead'
import { toDashboardLead } from '../utils/map-dashboard-lead'
import { filterLeads, leadsDefaultPageSize, paginateLeads, sortLeads } from '../utils/leads'
import { CrmListLayout } from './CrmListLayout'
import { ConvertLeadDialog } from './ConvertLeadDialog'
import { CreateLeadDialog } from './CreateLeadDialog'
import { LeadContactDialog } from './LeadContactDialog'
import { LeadsCards } from './leads-list/LeadsCards'
import { LeadsHeader } from './leads-list/LeadsHeader'
import { LeadsStatusFilters } from './leads-list/LeadsStatusFilters'
import { LeadsTable } from './leads-list/LeadsTable'

export function LeadsDashboardPage() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.leads')
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const tenantId = session?.tenantId ?? ''
  const leadsQuery = useLeads(tenantId)
  const updateLeadStage = useUpdateLeadStage(tenantId)
  const fixtureMode =
    process.env.NODE_ENV !== 'production' &&
    !leadsQuery.isLoading &&
    (leadsQuery.isError || (leadsQuery.data ?? []).length === 0)
  const leads = useMemo(
    () =>
      fixtureMode
        ? getLeadListFixtures(locale)
        : (leadsQuery.data ?? []).map((lead) => toDashboardLead(lead, locale)),
    [fixtureMode, leadsQuery.data, locale],
  )
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<LeadFilter>('Todos')
  const [sort, setSort] = useState<LeadTableSortState>(null)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(leadsDefaultPageSize)
  const [isCreateLeadDialogOpen, setIsCreateLeadDialogOpen] = useState(false)
  const [selectedContactLead, setSelectedContactLead] = useState<DashboardLead | null>(null)
  const [convertLead, setConvertLead] = useState<DashboardLead | null>(null)

  function handleStageChange(leadId: string, stage: LeadApiStage) {
    updateLeadStage.mutate({ leadId, stage })
  }

  const filteredLeads = useMemo(
    () => filterLeads(leads, search, activeFilter),
    [search, activeFilter, leads],
  )
  const sortedLeads = useMemo(() => sortLeads(filteredLeads, sort), [filteredLeads, sort])
  const leadsPage = useMemo(
    () => paginateLeads(sortedLeads, page, rowsPerPage),
    [sortedLeads, page, rowsPerPage],
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleFilterChange(filter: LeadFilter) {
    setActiveFilter(filter)
    setPage(1)
  }

  function handleSortChange(field: LeadTableSortField) {
    setSort((currentSort) => {
      if (currentSort?.field !== field) return { field, direction: 'asc' }

      return {
        field,
        direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
      }
    })
    setPage(1)
  }

  useEffect(() => {
    const leadId = searchParams?.get('leadId')
    const lead = leads.find((currentLead) => currentLead.id === leadId)
    if (!lead) return

    setSelectedContactLead(lead)
  }, [leads, searchParams])

  return (
    <>
      <CrmListLayout
        header={
          <LeadsHeader
            search={search}
            onSearchChange={handleSearchChange}
            onNewLead={() => setIsCreateLeadDialogOpen(true)}
          />
        }
        filters={
          <LeadsStatusFilters
            activeFilter={activeFilter}
            leads={leads}
            onFilterChange={handleFilterChange}
          />
        }
        table={
          <LeadsTable
            leads={leadsPage.items}
            sort={sort}
            onContactLead={setSelectedContactLead}
            onSortChange={handleSortChange}
          />
        }
        cards={<LeadsCards leads={leadsPage.items} onContactLead={setSelectedContactLead} />}
        isEmpty={leadsPage.items.length === 0}
        emptyMessage={t('empty')}
        pagination={{
          count: leadsPage.totalCount,
          page: leadsPage.page,
          rowsPerPage,
          onPageChange: setPage,
          onRowsPerPageChange: (nextRowsPerPage) => {
            setRowsPerPage(nextRowsPerPage)
            setPage(1)
          },
        }}
      />
      <CreateLeadDialog
        open={isCreateLeadDialogOpen}
        onClose={() => setIsCreateLeadDialogOpen(false)}
      />
      <LeadContactDialog
        lead={selectedContactLead}
        open={Boolean(selectedContactLead)}
        onClose={() => setSelectedContactLead(null)}
        onStageChange={handleStageChange}
        onConvertRequest={(lead) => {
          setSelectedContactLead(null)
          setConvertLead(lead)
        }}
      />
      <ConvertLeadDialog
        lead={convertLead}
        open={Boolean(convertLead)}
        onClose={() => setConvertLead(null)}
      />
    </>
  )
}
