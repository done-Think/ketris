import { findAvailableCrmContact } from '@server/crm/public/contact-lookup'
import type {
  PropertyOwnerContactDirectory,
  PropertyOwnerContactScope,
} from '../application/ports/property-owner-contact-directory.port'

export class CrmPropertyOwnerContactDirectory implements PropertyOwnerContactDirectory {
  findAvailableContact(scope: PropertyOwnerContactScope) {
    return findAvailableCrmContact(scope)
  }
}
