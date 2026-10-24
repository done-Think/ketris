import { isAgencyStaff } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'

import type { PropertyOwnerDirectory } from '../ports/property-owner-directory.port'
import type { ListPropertyOwnersInput } from '../../types/use-case-inputs'

export class ListPropertyOwnersUseCase {
  constructor(private readonly directory: PropertyOwnerDirectory) {}

  execute(input: ListPropertyOwnersInput) {
    if (!isAgencyStaff(input.actorPapel))
      throw new ForbiddenError('Somente a equipe da imobiliária consulta proprietários.')
    return this.directory.listActiveOwners(
      input.actorTenantId,
      input.page ?? 1,
      input.pageSize ?? 100,
    )
  }
}
