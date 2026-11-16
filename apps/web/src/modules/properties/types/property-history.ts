import type { components } from '@shared/types/generated/api'
import type { DashboardProperty, DashboardActivityTone } from './dashboard-property'

export type PropertyHistoryPage = components['schemas']['PropertyHistoryPage']
export type PropertyHistoryEvent = components['schemas']['PropertyHistoryEvent']
export type PropertyHistoryChange = PropertyHistoryEvent['changes'][number]
export type PropertyHistoryField = PropertyHistoryChange['field']
export type PropertyHistorySummary = PropertyHistoryPage['events'][number]
export type PropertyHistoryTimelineItem =
  | {
      kind: 'event'
      event: PropertyHistorySummary
      occurredAt: string
      tone: DashboardActivityTone
    }
  | {
      kind: 'legacy'
      item: DashboardProperty['activityHistory'][number]
      occurredAt?: string
      tone: DashboardActivityTone
    }
export interface PropertyHistoryTimelineOptions {
  events: PropertyHistorySummary[]
  legacy: DashboardProperty['activityHistory']
  page: number
  totalPages: number
  compact: boolean
}
export interface PropertyHistoryProps {
  propertyId: string
  compact?: boolean
  legacy: DashboardProperty['activityHistory']
}
export interface PropertyHistoryValueProps {
  field: PropertyHistoryField
  value: PropertyHistoryChange['before']
}
export interface PropertyHistoryEventDetailsProps {
  propertyId: string
  eventId: string
  showHeading?: boolean
}
export type PropertyFullHistoryProps = Pick<PropertyHistoryProps, 'propertyId' | 'legacy'>
export interface PropertyFullHistoryDialogProps extends PropertyFullHistoryProps {
  onClose: () => void
}
