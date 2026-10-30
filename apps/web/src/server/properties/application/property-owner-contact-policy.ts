import { isAgencyStaff } from '@server/auth/domain/roles'
import { ForbiddenError } from '@server/shared/errors'
import { PropertyOwnerContactValidationError } from '../domain/errors'
import type {
  PropertyOwnerContactDirectory,
  PropertyOwnerContactScope,
} from './ports/property-owner-contact-directory.port'

export async function assertOwnerContactChange(
  scope: Omit<PropertyOwnerContactScope, 'contactId'>,
  nextId: string | null | undefined,
  currentId: string | null | undefined,
  directory?: PropertyOwnerContactDirectory,
) {
  if (nextId === undefined || nextId === (currentId ?? null)) return
  if (!isAgencyStaff(scope.actorRole)) {
    throw new ForbiddenError('Somente a equipe da imobiliária vincula contatos ao imóvel.')
  }
  if (nextId && !(await directory?.findAvailableContact({ ...scope, contactId: nextId }))) {
    throw new PropertyOwnerContactValidationError()
  }
}
