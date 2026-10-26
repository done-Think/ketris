import type { CrmPageGroup } from '@server/crm/types/pagination'

export function crmPageCounts(groups: readonly CrmPageGroup[] = []) {
  return Object.fromEntries([
    ['ALL', groups.reduce((total, group) => total + group.count, 0)],
    ...groups.map((group) => [group.key, group.count]),
  ])
}
