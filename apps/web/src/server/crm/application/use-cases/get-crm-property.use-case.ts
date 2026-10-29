import { OpportunityPropertyNotFoundError } from '../../domain/errors'
import type { GetCrmPropertyInput } from '../../types/crm-properties'
import { assertCrmAccess } from '../authorization'
import type { CrmPropertyCatalog } from '../ports/crm-property-catalog.port'

export class GetCrmPropertyUseCase {
  constructor(private readonly catalog: CrmPropertyCatalog) {}
  async execute(input: GetCrmPropertyInput) {
    assertCrmAccess(input.actorRole)
    const property = await this.catalog.get(input.propertyId)
    if (!property) throw new OpportunityPropertyNotFoundError()
    return property
  }
}
