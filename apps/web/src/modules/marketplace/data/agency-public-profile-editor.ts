import { brand } from '@shared/theme/tokens'

import { agencies } from './agencies'
import type {
  AgencyPublicProfileEditorFormValues,
  AgencyPublicProfileSectionOption,
} from '../types/agency-public-profile-editor'

const editableAgency = agencies[0]
const encodedLogo = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240" viewBox="0 0 720 240">
  <rect width="720" height="240" rx="18" fill="${editableAgency.brand.backgroundColor}"/>
  <path d="M72 120 128 64l18 18-38 38 38 38-18 18-56-56Z" fill="${editableAgency.brand.primaryColor}"/>
  <path d="M136 102h118l28 36H136v-36Z" fill="${editableAgency.brand.primaryColor}"/>
  <text x="320" y="104" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="${editableAgency.brand.secondaryColor}">${editableAgency.brand.eyebrow}</text>
  <text x="320" y="154" font-family="Arial, sans-serif" font-size="54" font-weight="900" fill="${editableAgency.brand.primaryColor}">${editableAgency.brand.title}</text>
</svg>
`)

export const agencyPublicProfileSectionOptions: AgencyPublicProfileSectionOption[] = [
  {
    key: 'none',
    label: 'Nenhum',
    description: 'Não exibir seção nesta posição.',
  },
  {
    key: 'brand',
    label: 'Marca',
    description: 'Logo, banner, nome e chamada institucional.',
  },
  {
    key: 'metrics',
    label: 'Indicadores',
    description: 'Imóveis, equipe, anos de mercado e nota.',
  },
  {
    key: 'contact',
    label: 'Contato',
    description: 'Link público, telefone, e-mail e dados rápidos.',
  },
  {
    key: 'team',
    label: 'Equipe',
    description: 'Corretores em destaque na imobiliária.',
  },
  {
    key: 'listings',
    label: 'Imóveis',
    description: 'Cards de imóveis representados.',
  },
]

export const agencyPublicProfileEditorDefaultValues: AgencyPublicProfileEditorFormValues = {
  displayName: editableAgency.name,
  headline: editableAgency.brand.title,
  summary: editableAgency.summary,
  legalCreci: editableAgency.legalCreci,
  headquarters: editableAgency.headquarters,
  address: editableAgency.address,
  coverage: editableAgency.coverage.join(', '),
  segments: editableAgency.segments.join(', '),
  primaryColor: editableAgency.brand.primaryColor,
  accentColor: brand.magenta[500],
  backgroundColor: editableAgency.brand.backgroundColor,
  logoUrl: `data:image/svg+xml;charset=UTF-8,${encodedLogo}`,
  bannerUrl:
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80',
  sectionOrder: ['brand', 'metrics', 'contact', 'team', 'listings'],
}
