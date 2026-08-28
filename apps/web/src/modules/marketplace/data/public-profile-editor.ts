import { brand, surface } from '@shared/theme/tokens'

import { getBrokerProfileTheme } from '../config/broker-profile-themes'
import { brokers } from './brokers'
import type {
  PublicProfileEditorFormValues,
  PublicProfileSectionOption,
} from '../types/public-profile-editor'

const editableBroker = brokers[0]
const editableBrokerTheme = getBrokerProfileTheme(editableBroker.id)

export const publicProfileSectionOptions: PublicProfileSectionOption[] = [
  { key: 'none' },
  { key: 'hero' },
  { key: 'metrics' },
  { key: 'team' },
  { key: 'listings' },
  { key: 'contact' },
]

export const publicProfileEditorDefaultValues: PublicProfileEditorFormValues = {
  displayName: editableBroker.name,
  headline: editableBrokerTheme.signature,
  summary: editableBroker.bio,
  primaryColor: editableBrokerTheme.accent,
  accentColor: brand.magenta[500],
  backgroundColor: surface.paper,
  avatarUrl: editableBroker.avatar,
  bannerUrl: editableBrokerTheme.cover,
  teamMembers: brokers.slice(0, 3).map((broker) => ({
    name: broker.name,
    role: broker.specialties[0],
    avatarUrl: broker.avatar,
    profileUrl: broker.href,
  })),
  sectionOrder: ['hero', 'metrics', 'contact', 'team', 'listings'],
}
