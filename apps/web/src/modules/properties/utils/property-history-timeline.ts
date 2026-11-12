import type {
  PropertyHistoryTimelineItem,
  PropertyHistoryTimelineOptions,
} from '../types/property-history'

export function propertyHistoryTimeline({
  events,
  legacy,
  page,
  totalPages,
  compact,
}: PropertyHistoryTimelineOptions): PropertyHistoryTimelineItem[] {
  const oldestEvent = Math.min(...events.map((event) => Date.parse(event.createdAt)))
  const references =
    page >= Math.max(1, totalPages)
      ? legacy.filter((item) => {
          if (item.action === 'UPDATED' && events.length) return false
          if (item.action && events.some((event) => event.action === item.action)) return false
          return !item.occurredAt || Date.parse(item.occurredAt) < oldestEvent
        })
      : []
  const items: PropertyHistoryTimelineItem[] = [
    ...events.map((event): PropertyHistoryTimelineItem => ({
      kind: 'event',
      event,
      occurredAt: event.createdAt,
      tone:
        event.action === 'CREATED' ? 'neutral' : event.action === 'PUBLISHED' ? 'success' : 'info',
    })),
    ...references.map((item): PropertyHistoryTimelineItem => ({
      kind: 'legacy',
      item,
      occurredAt: item.occurredAt,
      tone: item.tone,
    })),
  ]
  items.sort((a, b) => {
    const first = a.occurredAt ? Date.parse(a.occurredAt) : -Infinity
    const second = b.occurredAt ? Date.parse(b.occurredAt) : -Infinity
    return first === second ? 0 : first > second ? -1 : 1
  })
  return compact ? items.slice(0, 3) : items
}
