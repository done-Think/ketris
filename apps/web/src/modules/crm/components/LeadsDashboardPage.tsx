'use client'

import { useCrmFormatter } from '../hooks/use-crm-formatter'

import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useListState } from '@shared/hooks/use-list-state'
import { crmPageCounts } from '../utils/page-counts'

import type { AppLocale } from '@/i18n/types/locale.types'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { useLead, useLeads, useUpdateLeadStage } from '../hooks/use-leads'
import type {
  DashboardLead,
  LeadApiStage,
  LeadFilter,
  LeadTableSortField,
  LeadTableSortState,
} from '../types/lead'
import { toDashboardLead } from '../utils/map-dashboard-lead'
import { ConvertLeadDialog } from './ConvertLeadDialog'
import { CreateLeadDialog } from './CreateLeadDialog'
import { CrmListLayout } from './CrmListLayout'
import { LeadContactDialog } from './LeadContactDialog'
import { LeadsCards } from './leads-list/LeadsCards'
import { LeadsHeader } from './leads-list/LeadsHeader'
import { LeadsStatusFilters } from './leads-list/LeadsStatusFilters'
import { LeadsTable } from './leads-list/LeadsTable'

export function LeadsDashboardPage() {
  const format = useCrmFormatter()
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.leads')
  const searchParams = useSearchParams()
  const { filters: list, setFilter } = useListState({
    search: '',
    activeFilter: 'ALL' as LeadFilter,
    sort: null as LeadTableSortState,
    page: 1,
    pageSize: 5,
  })
  const query = useDebouncedValue(list.search)
  const leadsQuery = useLeads({
    q: query || undefined,
    stage: list.activeFilter === 'ALL' ? undefined : list.activeFilter,
    page: list.page,
    pageSize: list.pageSize,
    locale,
    sortBy: list.sort?.field,
    sortDirection: list.sort?.direction,
  })
  const linkedLeadId = searchParams?.get('leadId') ?? null
  const updateLeadStage = useUpdateLeadStage()
  const leads = (leadsQuery.data?.leads ?? []).map((lead) => toDashboardLead(lead, locale, format))
  const [isCreateLeadDialogOpen, setIsCreateLeadDialogOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null | undefined>(undefined)
  const contactId = selectedContactId === undefined ? linkedLeadId : selectedContactId
  const contactQuery = useLead(contactId)
  const [convertLead, setConvertLead] = useState<DashboardLead | null>(null)

  function handleStageChange(leadId: string, stage: LeadApiStage) {
    updateLeadStage.mutate({ leadId, stage })
  }

  function handleSearchChange(value: string) {
    setFilter('search', value)
    setFilter('page', 1)
  }
  function handleFilterChange(value: LeadFilter) {
    setFilter('activeFilter', value)
    setFilter('page', 1)
  }
  function handleSortChange(field: LeadTableSortField) {
    setFilter('sort', {
      field,
      direction: list.sort?.field === field && list.sort.direction === 'asc' ? 'desc' : 'asc',
    })
    setFilter('page', 1)
  }

  const contactLead = contactQuery.data
    ? toDashboardLead(contactQuery.data, locale, format)
    : (leads.find((lead) => lead.id === contactId) ?? null)
  const openContact = (lead: DashboardLead) => setSelectedContactId(lead.id)

  return (
    <>
      <CrmListLayout
        isLoading={leadsQuery.isLoading}
        error={leadsQuery.isError}
        onRetry={() => void leadsQuery.refetch()}
        header={
          <LeadsHeader
            search={list.search}
            onSearchChange={handleSearchChange}
            onNewLead={() => setIsCreateLeadDialogOpen(true)}
          />
        }
        filters={
          <LeadsStatusFilters
            activeFilter={list.activeFilter}
            counts={crmPageCounts(leadsQuery.data?.groups)}
            onFilterChange={handleFilterChange}
          />
        }
        table={
          <LeadsTable
            leads={leads}
            sort={list.sort}
            onContactLead={openContact}
            onSortChange={handleSortChange}
          />
        }
        cards={<LeadsCards leads={leads} onContactLead={openContact} />}
        isEmpty={leads.length === 0}
        emptyMessage={t('empty')}
        pagination={{
          count: leadsQuery.data?.pagination.totalCount ?? 0,
          page: leadsQuery.data?.pagination.page ?? list.page,
          rowsPerPage: list.pageSize,
          onPageChange: (value) => setFilter('page', value),
          onRowsPerPageChange: (nextRowsPerPage) => {
            setFilter('pageSize', nextRowsPerPage)
            setFilter('page', 1)
          },
        }}
      />
      <CreateLeadDialog
        open={isCreateLeadDialogOpen}
        onClose={() => setIsCreateLeadDialogOpen(false)}
      />
      <LeadContactDialog
        lead={contactLead}
        open={Boolean(contactLead)}
        onClose={() => setSelectedContactId(null)}
        onStageChange={handleStageChange}
        onConvertRequest={(lead) => {
          setSelectedContactId(null)
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
