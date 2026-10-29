import type { ListOpportunitiesResponseDTO } from '@shared/types/generated/crm/dto'
type CrmPageGroup = ListOpportunitiesResponseDTO['groups'][number]

export function crmPageCounts(groups: readonly CrmPageGroup[] = []) {
  return Object.fromEntries([
    ['ALL', groups.reduce((total, group) => total + group.count, 0)],
    ...groups.map((group) => [group.key, group.count]),
  ])
}
