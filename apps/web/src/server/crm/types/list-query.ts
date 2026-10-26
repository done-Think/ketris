import type { Prisma } from '@prisma/client'
import type { CrmListFilters, CrmPageGroup } from './pagination'

export type CrmListKind = 'contact' | 'lead' | 'opportunity'
export interface CrmListQueryFilters extends CrmListFilters {
  summaryScope?: 'all' | 'results'
  status?: string
  statuses?: string[]
  stage?: string
  type?: string
  contactId?: string
  includeArchived?: boolean
}
export interface CrmPageIds {
  ids: string[]
  pagination: { page: number; pageSize: number; pageCount: number; totalCount: number }
  groups: CrmPageGroup[]
}
export interface CrmListSql {
  from: Prisma.Sql
  base: Prisma.Sql
  filter: Prisma.Sql
  order: Prisma.Sql
  group: Prisma.Sql
  amount: Prisma.Sql
  purpose: Prisma.Sql
}
export interface CrmSqlGroup {
  key: string
  count: bigint
  amount: unknown
  rental: unknown
  sale: unknown
  unclassified: unknown
}
