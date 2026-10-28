import en from '@/i18n/messages/en-US/dashboard.json'
import es from '@/i18n/messages/es-ES/dashboard.json'
import pt from '@/i18n/messages/pt-BR/dashboard.json'
import { Prisma } from '@prisma/client'
import { isAgencyManager } from '@server/auth/domain/roles'
import { maintenanceCategoryKeys } from '@shared/lib/utils/maintenance-categories'
import type { MaintenanceTicketListFilters } from '../types/maintenance-ticket'

const dictionaries = {
  'pt-BR': pt.maintenance.categories,
  'en-US': en.maintenance.categories,
  'es-ES': es.maintenance.categories,
}
function normalized(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
function normalizedSql(value: Prisma.Sql) {
  return Prisma.sql`lower(translate(${value}, 'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇçÑñ', 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'))`
}

export function maintenanceListQuery(filters: MaintenanceTicketListFilters) {
  const actor = filters.actor
  const conditions: Prisma.Sql[] = [
    filters.archived ? Prisma.sql`c."deletedAt" IS NOT NULL` : Prisma.sql`c."deletedAt" IS NULL`,
  ]
  if (isAgencyManager(actor.actorRole))
    conditions.push(Prisma.sql`c."tenantId" = ${actor.actorTenantId}`)
  else {
    conditions.push(
      Prisma.sql`c."deletedAt" IS NULL`,
      Prisma.sql`ct."tenantId" = c."tenantId" AND ct."propertyId" = c."propertyId" AND i."tenantId" = c."tenantId"`,
    )
    if (actor.actorRole === 'RENTER')
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM contract_parties p JOIN users u ON u.id = p."userId" WHERE p."contractId" = ct.id AND p.role = 'RENTER' AND p."userId" = ${actor.actorId} AND u.active = true AND u.role = 'RENTER')`,
      )
    else {
      conditions.push(Prisma.sql`c."tenantId" = ${actor.actorTenantId}`)
      if (actor.actorRole === 'AGENT')
        conditions.push(
          Prisma.sql`(c."responsibleId" = ${actor.actorId} OR i."responsibleId" = ${actor.actorId})`,
        )
      else if (actor.actorRole === 'PROPERTY_OWNER')
        conditions.push(
          Prisma.sql`(c."responsibleId" = ${actor.actorId} OR i."ownerId" = ${actor.actorId})`,
        )
      else conditions.push(Prisma.sql`false`)
    }
  }
  const base = Prisma.join(conditions, ' AND ')
  const filtered = [...conditions]
  if (filters.status) filtered.push(Prisma.sql`c.status::text = ${filters.status}`)
  if (filters.priority) filtered.push(Prisma.sql`c.priority::text = ${filters.priority}`)
  if (filters.category) filtered.push(Prisma.sql`c.category::text = ${filters.category}`)
  if (filters.propertyId) filtered.push(Prisma.sql`c."propertyId" = ${filters.propertyId}`)
  if (filters.search?.trim()) {
    const term = '%' + normalized(filters.search.trim()).replace(/[\\%_]/g, '\\$&') + '%'
    const labels = dictionaries[filters.locale ?? 'pt-BR']
    const matchingCategories = Object.entries(maintenanceCategoryKeys)
      .filter(([, key]) => normalized(labels[key]).includes(normalized(filters.search!.trim())))
      .map(([code]) => code)
    const matches = [
      Prisma.sql`${normalizedSql(Prisma.sql`c.title`)} LIKE ${term}`,
      Prisma.sql`${normalizedSql(Prisma.sql`i.title`)} LIKE ${term}`,
    ]
    if (matchingCategories.length)
      matches.push(Prisma.sql`c.category::text IN (${Prisma.join(matchingCategories)})`)
    filtered.push(Prisma.sql`(${Prisma.join(matches, ' OR ')})`)
  }
  return {
    from: Prisma.sql`maintenance_tickets c JOIN properties i ON i.id = c."propertyId" LEFT JOIN contracts ct ON ct.id = c."contractId"`,
    base,
    filter: Prisma.join(filtered, ' AND '),
  }
}
