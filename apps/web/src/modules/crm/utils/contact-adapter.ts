import type { AppLocale } from '@/i18n/types/locale.types'
import type { ApiContactListItem, ContactListItem } from '../types/contact'
import type { CrmFormatters } from '../types/formatters'
import { formatRelativeDate } from './formatters'

export function mapContactToListItem(
  contact: ApiContactListItem,
  locale?: AppLocale,
  format?: CrmFormatters,
): ContactListItem {
  return {
    id: contact.id,
    name: contact.name,
    type: contact.type,
    phone: contact.phone ?? '',
    email: contact.email,
    propertyCount: contact.propertyCount,
    lastInteraction: contact.lastInteraction
      ? (format?.relative(contact.lastInteraction) ??
        formatRelativeDate(contact.lastInteraction, new Date(), locale))
      : '',
    avatarUrl: contact.avatarUrl ?? '',
  }
}
