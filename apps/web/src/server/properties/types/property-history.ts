import type { z } from 'zod'
import type { GetPropertyInput } from './use-case-inputs'
import type { Property } from './property'
import type {
  propertyHistoryChangeSchema,
  propertyHistoryEventSchema,
  propertyHistoryPageSchema,
} from '../schemas/property-history.schema'

export type PropertyHistoryChange = z.infer<typeof propertyHistoryChangeSchema>
export type PropertyHistoryEvent = z.infer<typeof propertyHistoryEventSchema>
export type PropertyHistoryPage = z.infer<typeof propertyHistoryPageSchema>
export type PropertyHistoryAction = PropertyHistoryEvent['action']
export type PropertyStatusMutationAction = Exclude<PropertyHistoryAction, 'CREATED' | 'UPDATED'>
export interface PropertyHistoryReferences {
  ownerName: string | null
  brokers?: PropertyHistoryPerson[]
}
export interface PropertyHistoryPerson {
  id: string
  name: string | null
}
export interface PropertyAccessHistorySnapshot {
  id: string
  responsible: PropertyHistoryPerson
  brokers: PropertyHistoryPerson[]
}
export interface RecordPropertyHistoryInput {
  before: Property | null
  after: Property
  previous: PropertyHistoryReferences
  next: PropertyHistoryReferences
  actorId: string | null
  action: PropertyHistoryAction
}
export type ReadPropertyHistoryInput = GetPropertyInput & {
  eventId?: string
  page?: number
  pageSize?: number
}
export interface RecordPropertyFieldHistoryInput {
  tenantId: string
  propertyId: string
  actorId: string | null
  action: PropertyHistoryAction
  changes: PropertyHistoryChange[]
}
