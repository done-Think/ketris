import type { AgendaPropertyCatalog } from './ports/agenda-property-catalog.port'
import type { AgendaEvent } from '../domain/agenda-event.entity'
import type { AgendaReadActor } from '../types/read-actor'
import type { AgendaManageActor } from '../types/manage-actor'
import type { PreparedAgendaPropertySummary } from '../types/property-catalog'

export async function withAgendaPropertySummaries(
  catalog: AgendaPropertyCatalog | undefined,
  actor: AgendaManageActor,
  events: AgendaEvent[],
): Promise<AgendaEvent[]> {
  if (!catalog) return events
  const propertyIds = [
    ...new Set(events.flatMap((event) => (event.propertyId ? [event.propertyId] : []))),
  ]
  const summaries = await catalog.summaries(
    { ...actor, actorUserId: actor.actorUserId ?? '' } satisfies AgendaReadActor,
    propertyIds,
  )
  const labels = new Map(summaries.map((property) => [property.id, property.label]))
  return events.map((event) => ({
    ...event,
    propertyLabel: event.propertyId ? (labels.get(event.propertyId) ?? null) : null,
  }))
}

export async function withAgendaPropertySummary(
  catalog: AgendaPropertyCatalog | undefined,
  actor: AgendaManageActor,
  event: AgendaEvent,
): Promise<AgendaEvent> {
  return (await withAgendaPropertySummaries(catalog, actor, [event]))[0]
}

export async function prepareAgendaPropertySummary(
  catalog: AgendaPropertyCatalog | undefined,
  actor: AgendaManageActor,
  propertyId: string | null | undefined,
): Promise<PreparedAgendaPropertySummary | undefined> {
  if (!catalog) return undefined
  const summaries = propertyId
    ? await catalog.summaries({ ...actor, actorUserId: actor.actorUserId ?? '' }, [propertyId])
    : []
  return { propertyLabel: summaries[0]?.label ?? null }
}

export function withPreparedAgendaPropertySummary(
  event: AgendaEvent,
  summary: PreparedAgendaPropertySummary | undefined,
): AgendaEvent {
  return summary ? { ...event, ...summary } : event
}
