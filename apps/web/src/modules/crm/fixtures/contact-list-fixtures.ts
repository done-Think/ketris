import type { ContactListItem } from '../types/contact'
import type { AppLocale } from '@/i18n/types/locale.types'
import { formatRelativeDate } from '../utils/formatters'

export const contactsFixtureTotal = 234

export const contactListFixtures: readonly (ContactListItem & { minutesAgo: number })[] = [
  {
    id: 'ricardo-mendes',
    name: 'Ricardo Mendes',
    type: 'Locatário',
    phone: '(11) 98722-1200',
    email: 'ricardo.mendes@email.com',
    propertyCount: 2,
    lastInteraction: '',
    minutesAgo: 120,
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 'sandra-vasconcellos',
    name: 'Sandra Vasconcellos',
    type: 'Proprietário',
    phone: '(11) 99100-4491',
    email: 'sandra.vasc@corpprop.br',
    propertyCount: 4,
    lastInteraction: '',
    minutesAgo: 1440,
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 'heitor-prado',
    name: 'Heitor Prado',
    type: 'Corretor',
    phone: '(11) 98112-9900',
    email: 'heitor.prado@ketrisrealty.com',
    propertyCount: 12,
    lastInteraction: '',
    minutesAgo: 180,
    avatarUrl:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 'leticia-ramos',
    name: 'Letícia Ramos',
    type: 'Locatário',
    phone: '(11) 97711-2004',
    email: 'leticia_ramos@outlook.com',
    propertyCount: 1,
    lastInteraction: '',
    minutesAgo: 4320,
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 'carlos-eduardo',
    name: 'Carlos Eduardo',
    type: 'Locatário',
    phone: '(11) 98221-1250',
    email: 'carlos.edu@tecblue.com',
    propertyCount: 2,
    lastInteraction: '',
    minutesAgo: 1440,
    avatarUrl:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=80&q=80',
  },
  {
    id: 'ana-beatriz-ramos',
    name: 'Ana Beatriz Ramos',
    type: 'Proprietário',
    phone: '(11) 99882-1011',
    email: 'anabeatriz@grupojardins.com',
    propertyCount: 8,
    lastInteraction: '',
    minutesAgo: 7200,
    avatarUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80',
  },
] as const

export function getContactListFixtures(locale: AppLocale): ContactListItem[] {
  const now = new Date()
  return contactListFixtures.map(({ minutesAgo, ...contact }) => ({
    ...contact,
    lastInteraction: formatRelativeDate(new Date(now.getTime() - minutesAgo * 60_000), now, locale),
  }))
}
