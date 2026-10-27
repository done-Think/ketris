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
    filters.archived ? Prisma.sql`c."excluidoEm" IS NOT NULL` : Prisma.sql`c."excluidoEm" IS NULL`,
  ]
  if (isAgencyManager(actor.actorPapel))
    conditions.push(Prisma.sql`c."tenantId" = ${actor.actorTenantId}`)
  else {
    conditions.push(
      Prisma.sql`c."excluidoEm" IS NULL`,
      Prisma.sql`ct."tenantId" = c."tenantId" AND ct."imovelId" = c."imovelId" AND i."tenantId" = c."tenantId"`,
    )
    if (actor.actorPapel === 'RENTER')
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM partes_contrato p JOIN usuarios u ON u.id = p."usuarioId" WHERE p."contratoId" = ct.id AND p.papel = 'LOCATARIO' AND p."usuarioId" = ${actor.actorId} AND u.ativo = true AND u.papel = 'RENTER')`,
      )
    else {
      conditions.push(Prisma.sql`c."tenantId" = ${actor.actorTenantId}`)
      if (actor.actorPapel === 'AGENT')
        conditions.push(
          Prisma.sql`(c."responsavelId" = ${actor.actorId} OR i."responsavelId" = ${actor.actorId})`,
        )
      else if (actor.actorPapel === 'PROPERTY_OWNER')
        conditions.push(
          Prisma.sql`(c."responsavelId" = ${actor.actorId} OR i."proprietarioId" = ${actor.actorId})`,
        )
      else conditions.push(Prisma.sql`false`)
    }
  }
  const base = Prisma.join(conditions, ' AND ')
  const filtered = [...conditions]
  if (filters.status) filtered.push(Prisma.sql`c.status::text = ${filters.status}`)
  if (filters.priority) filtered.push(Prisma.sql`c.prioridade::text = ${filters.priority}`)
  if (filters.category) filtered.push(Prisma.sql`c.categoria::text = ${filters.category}`)
  if (filters.propertyId) filtered.push(Prisma.sql`c."imovelId" = ${filters.propertyId}`)
  if (filters.search?.trim()) {
    const term = '%' + normalized(filters.search.trim()).replace(/[\\%_]/g, '\\$&') + '%'
    const labels = dictionaries[filters.locale ?? 'pt-BR']
    const matchingCategories = Object.entries(maintenanceCategoryKeys)
      .filter(([, key]) => normalized(labels[key]).includes(normalized(filters.search!.trim())))
      .map(([code]) => code)
    const matches = [
      Prisma.sql`${normalizedSql(Prisma.sql`c.titulo`)} LIKE ${term}`,
      Prisma.sql`${normalizedSql(Prisma.sql`i.titulo`)} LIKE ${term}`,
    ]
    if (matchingCategories.length)
      matches.push(Prisma.sql`c.categoria::text IN (${Prisma.join(matchingCategories)})`)
    filtered.push(Prisma.sql`(${Prisma.join(matches, ' OR ')})`)
  }
  return {
    from: Prisma.sql`chamados_manutencao c JOIN imoveis i ON i.id = c."imovelId" LEFT JOIN contratos ct ON ct.id = c."contratoId"`,
    base,
    filter: Prisma.join(filtered, ' AND '),
  }
}
