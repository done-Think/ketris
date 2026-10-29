import { Prisma } from '@prisma/client'
import pt from '@/i18n/messages/pt-BR/contracts.json'
import en from '@/i18n/messages/en-US/contracts.json'
import es from '@/i18n/messages/es-ES/contracts.json'
import type { ContractListFilters } from '../types/contract-entity'
import type { ContractStatus } from '../types/contract'

const dictionaries = { 'pt-BR': pt, 'en-US': en, 'es-ES': es }
const statusKeys: Record<ContractStatus, keyof typeof pt.status> = {
  DRAFT: 'draft',
  IN_REVIEW: 'review',
  AWAITING_SIGNATURE: 'awaitingSignature',
  SIGNED: 'signed',
  ACTIVE: 'active',
  CLOSED: 'closed',
  CANCELED: 'cancelled',
}

export function contractDisplayOrder(filters: ContractListFilters) {
  const columns = {
    property: Prisma.sql`i.title`,
    tenant: Prisma.sql`(SELECT MIN(p.name) FROM contract_parties p WHERE p."contractId" = c.id AND p.role = 'RENTER')`,
    amount: Prisma.sql`c.amount`,
    startDate: Prisma.sql`c."startDate"`,
    endDate: Prisma.sql`c."endDate"`,
    updatedAt: Prisma.sql`c."updatedAt"`,
  }
  if (filters.sortBy !== 'status') return columns[filters.sortBy ?? 'updatedAt']
  const locale = filters.locale ?? 'pt-BR'
  const collator = new Intl.Collator(locale)
  const keys = Object.entries(statusKeys).sort((a, b) =>
    collator.compare(dictionaries[locale].status[a[1]], dictionaries[locale].status[b[1]]),
  )
  return Prisma.sql`CASE c.status::text ${Prisma.join(
    keys.map(([code], index) => Prisma.sql`WHEN ${code} THEN ${index}`),
    ' ',
  )} END`
}
