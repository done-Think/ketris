import type { AgendaPropertyCatalog } from '../ports/agenda-property-catalog.port'
import type { AgendaPropertyOptionsQuery } from '../../types/property-catalog'

export class ListAgendaPropertiesUseCase {
  constructor(private readonly properties: AgendaPropertyCatalog) {}
  execute(input: AgendaPropertyOptionsQuery) {
    return this.properties.list(input)
  }
}
