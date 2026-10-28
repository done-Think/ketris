'use client'

import { useCrmFormatter } from '../hooks/use-crm-formatter'

import { useRouter } from '@/i18n/navigation'
import type { AppLocale } from '@/i18n/types/locale.types'
import { useDebouncedValue } from '@shared/hooks/use-debounced-value'
import { useListState } from '@shared/hooks/use-list-state'
import { useLocale, useTranslations } from 'next-intl'
import { useOpportunities } from '../hooks/use-opportunities'
import type {
  CrmProposalsListProps,
  ProposalManagementFilterId,
  ProposalManagementListItem,
} from '../types/proposal-management'
import { toProposalPage, toProposalSummary } from '../utils/proposal-page'
import { CrmListLayout } from './CrmListLayout'
import { ProposalKpiCards } from './proposals-list/ProposalKpiCards'
import { ProposalMobileCards } from './proposals-list/ProposalMobileCards'
import { ProposalStatusFilters } from './proposals-list/ProposalStatusFilters'
import { ProposalsTable } from './proposals-list/ProposalsTable'

export function CrmProposalsList({ search, header, embedded }: CrmProposalsListProps) {
  const format = useCrmFormatter()
  const locale = useLocale() as AppLocale
  const t = useTranslations('crm.pipeline')
  const router = useRouter()
  const { filters, setFilter } = useListState({
    status: 'all' as ProposalManagementFilterId,
    page: 1,
    pageSize: 5,
  })
  const query = useDebouncedValue(search)
  const opportunities = useOpportunities({
    q: query || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    page: filters.page,
    pageSize: filters.pageSize,
    locale,
  })
  const page = toProposalPage(opportunities.data, format)
  const summary = toProposalSummary(opportunities.data, format)
  const actions = {
    onViewProposal: (proposal: ProposalManagementListItem) =>
      router.push({ pathname: '/crm/opportunities/[id]', params: { id: proposal.id } }),
  }
  return (
    <CrmListLayout
      embedded={embedded}
      header={header}
      filters={
        <>
          <ProposalStatusFilters
            activeStatus={filters.status}
            summary={summary}
            onStatusChange={(value) => {
              setFilter('status', value)
              setFilter('page', 1)
            }}
          />
          <ProposalKpiCards summary={summary} />
        </>
      }
      isLoading={opportunities.isLoading}
      error={opportunities.isError}
      onRetry={() => void opportunities.refetch()}
      table={<ProposalsTable proposals={page.items} {...actions} />}
      cards={<ProposalMobileCards proposals={page.items} {...actions} />}
      isEmpty={!page.items.length}
      emptyMessage={t('noResults')}
      pagination={{
        count: page.totalCount,
        page: page.page,
        rowsPerPage: filters.pageSize,
        onPageChange: (value) => setFilter('page', value),
        onRowsPerPageChange: (value) => {
          setFilter('pageSize', value)
          setFilter('page', 1)
        },
      }}
    />
  )
}
