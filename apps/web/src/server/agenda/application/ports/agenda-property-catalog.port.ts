import type { AgendaReadActor } from '../../types/read-actor'
import type {
  AgendaPropertyOptionsQuery,
  AgendaPropertyOptionsPage,
  AgendaPropertyOption,
} from '../../types/property-catalog'

export interface AgendaPropertyCatalog {
  list(query: AgendaPropertyOptionsQuery): Promise<AgendaPropertyOptionsPage>
  summaries(actor: AgendaReadActor, propertyIds: string[]): Promise<AgendaPropertyOption[]>
}
