import { describe, expect, it } from 'vitest'
import { propertyHistoryTimeline } from '../../utils/property-history-timeline'
import type { PropertyHistoryTimelineOptions } from '../../types/property-history'

const options: PropertyHistoryTimelineOptions = {
  compact: false,
  page: 1,
  totalPages: 1,
  events: [
    {
      id: 'audit',
      action: 'UPDATED',
      actorName: 'Ana',
      actorRole: 'AGENT',
      createdAt: '2026-11-12T12:00:00Z',
      fields: ['title'],
    },
  ],
  legacy: [
    {
      action: 'UPDATED',
      occurredAt: '2026-11-12T12:00:00Z',
      label: 'Updated',
      date: 'now',
      tone: 'info',
    },
    {
      action: 'PUBLISHED',
      occurredAt: '2026-11-10T12:00:00Z',
      label: 'Published',
      date: 'two days ago',
      tone: 'success',
    },
    {
      action: 'CREATED',
      occurredAt: '2026-11-09T12:00:00Z',
      label: 'Created',
      date: 'three days ago',
      tone: 'neutral',
    },
  ],
}

describe('unified property history', () => {
  it('preserves all reference dates when no audited events exist', () => {
    const items = propertyHistoryTimeline({ ...options, events: [], totalPages: 0 })
    expect(items).toHaveLength(3)
    expect(items.every((item) => item.kind === 'legacy')).toBe(true)
  })
  it('replaces the updated snapshot with its clickable event and orders older dates below it', () => {
    const items = propertyHistoryTimeline(options)
    expect(items.map((item) => (item.kind === 'event' ? item.event.id : item.item.label))).toEqual([
      'audit',
      'Published',
      'Created',
    ])
  })
  it('adds reference dates only on the final page and suppresses an audited publication', () => {
    expect(propertyHistoryTimeline({ ...options, totalPages: 2 })).toHaveLength(1)
    const items = propertyHistoryTimeline({
      ...options,
      page: 2,
      totalPages: 2,
      events: [{ ...options.events[0], action: 'PUBLISHED', createdAt: '2026-11-10T12:00:00Z' }],
    })
    expect(items.map((item) => (item.kind === 'event' ? item.event.id : item.item.label))).toEqual([
      'audit',
      'Created',
    ])
  })
  it('keeps the compact view limited to the latest three items', () => {
    const events = Array.from({ length: 4 }, (_, index) => ({
      ...options.events[0],
      id: `event-${index}`,
      createdAt: `2026-11-1${index + 2}T12:00:00Z`,
    }))
    expect(
      propertyHistoryTimeline({ ...options, events, compact: true }).map((item) =>
        item.kind === 'event' ? item.event.id : item.item.label,
      ),
    ).toEqual(['event-3', 'event-2', 'event-1'])
  })
})
