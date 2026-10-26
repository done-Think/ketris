import type { ListCrmPropertiesInput } from '../../types/crm-properties'
import { assertCrmAccess } from '../authorization'
import type { CrmPropertyCatalog } from '../ports/crm-property-catalog.port'

export class ListCrmPropertiesUseCase {
  constructor(private readonly catalog: CrmPropertyCatalog) {}
  async execute(input: ListCrmPropertiesInput) {
    assertCrmAccess(input.actorPapel)
    return this.catalog.list(input.filters)
  }
}
