import { crmContainer } from '../container'
import { ContactNotFoundError } from '../domain/errors'
import { ForbiddenError } from '@server/shared/errors'
import type { GetContactInput } from '../types/get-contact.use-case.types'

/** Contact references for other modules, subject to the same CRM visibility rules. */
export async function findAvailableCrmContact(input: GetContactInput) {
  try {
    const contact = await crmContainer.getContactUseCase.execute(input)
    return contact.archivedAt ? null : { id: contact.id, name: contact.name }
  } catch (error) {
    if (error instanceof ContactNotFoundError || error instanceof ForbiddenError) return null
    throw error
  }
}
