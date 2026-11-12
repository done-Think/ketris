import { isAgencyManager } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'
import type { PropertyBrokerDirectory } from '../ports/property-broker-directory.port'
import type { ListPropertyBrokersInput } from '../../types/use-case-inputs'

export class ListPropertyBrokersUseCase {
  constructor(private readonly directory: PropertyBrokerDirectory) {}

  execute(input: ListPropertyBrokersInput) {
    if (!isAgencyManager(input.actorRole)) throw new ForbiddenError()
    return this.directory.listActiveBrokers(
      input.actorTenantId,
      input.page ?? 1,
      input.pageSize ?? 100,
    )
  }
}
