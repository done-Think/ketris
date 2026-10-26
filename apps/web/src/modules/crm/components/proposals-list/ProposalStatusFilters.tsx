import { crmStatusKey } from '@server/crm/constants/translation-keys'
import { useTranslations } from 'next-intl'
import { proposalStatusFilters } from '../../config/proposal-statuses'
import type { ProposalStatusFiltersProps } from '../../types/proposal-management'
import { CrmStatusFilters } from '../CrmStatusFilters'

export function ProposalStatusFilters({
  activeStatus,
  summary,
  onStatusChange,
}: ProposalStatusFiltersProps) {
  const t = useTranslations('crm.proposalManagement')
  const tStatus = useTranslations('crm.opportunityDetail.statuses')
  return (
    <CrmStatusFilters
      value={activeStatus}
      counts={{ all: summary.totalCount, ...summary.statusCounts }}
      onChange={onStatusChange}
      ariaLabel={t('filterByStatus')}
      options={proposalStatusFilters.map(({ id }) => ({
        value: id,
        label: id === 'all' ? t('allStatuses') : tStatus(crmStatusKey(id)),
      }))}
    />
  )
}
