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
  {
    key: 'none',
    label: 'Nenhum',
    description: 'Não exibir seção nesta posição.',
  },
  {
    key: 'hero',
    label: 'Apresentação',
    description: 'Banner, foto, nome e chamada principal.',
  },
  {
    key: 'metrics',
    label: 'Indicadores',
    description: 'Nota, tempo médio, ativos e negociações.',
  },
  {
    key: 'team',
    label: 'Equipe',
    description: 'Corretores ou pessoas destacadas no perfil.',
  },
  {
    key: 'listings',
    label: 'Imóveis',
    description: 'Cards de imóveis representados.',
  },
  {
    key: 'contact',
    label: 'Contato',
    description: 'Link público, telefone, e-mail e dados rápidos.',
  },
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
  sectionOrder: ['hero', 'metrics', 'contact', 'team', 'listings'],
}
