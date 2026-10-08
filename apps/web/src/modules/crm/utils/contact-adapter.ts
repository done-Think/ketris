import type {
  ApiContactListItem,
  ApiContactType,
  ContactListItem,
  ContactType,
} from '../types/contact'
import { formatRelativeDate } from './formatters'
import type { AppLocale } from '@/i18n/types/locale.types'

const typeLabelByApiType: Record<ApiContactType, ContactType> = {
  PROPRIETARIO: 'Proprietário',
  LOCATARIO: 'Locatário',
  CORRETOR: 'Corretor',
}

export function mapContactToListItem(
  contact: ApiContactListItem,
  locale?: AppLocale,
): ContactListItem {
  return {
    id: contact.id,
    name: contact.name,
    type: typeLabelByApiType[contact.type],
    phone: contact.phone ?? '',
    email: contact.email,
    propertyCount: contact.propertyCount,
    lastInteraction: contact.lastInteraction
      ? formatRelativeDate(contact.lastInteraction, new Date(), locale)
      : '',
    avatarUrl: contact.avatarUrl ?? '',
  }
}
