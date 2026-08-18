import { alpha, brand } from '@shared/theme/tokens'

import type {
  CreatePropertyStepKey,
  DashboardActivityTone,
  DashboardPropertyDetailTab,
  DashboardPropertyStatus,
} from '../types/dashboard-property'

export const dashboardPropertyStatusStyles: Record<
  DashboardPropertyStatus,
  { color: string; bgcolor: string }
> = {
  Disponível: { color: brand.semantic.success, bgcolor: alpha.graphite[6] },
  Alugado: { color: brand.semantic.info, bgcolor: alpha.graphite[6] },
  Ativo: { color: brand.semantic.success, bgcolor: alpha.graphite[6] },
  'Em análise': { color: brand.semantic.warning, bgcolor: alpha.graphite[6] },
  Vencendo: { color: brand.semantic.warning, bgcolor: alpha.graphite[6] },
  Inativo: { color: brand.semantic.error, bgcolor: alpha.error[10] },
}

export const dashboardPropertyActivityToneStyles: Record<DashboardActivityTone, string> = {
  success: brand.semantic.success,
  accent: brand.magenta[500],
  info: brand.semantic.info,
  warning: brand.semantic.warning,
  neutral: brand.neutral[500],
  error: brand.semantic.error,
}

export const dashboardPropertyColumns = [
  'IMÓVEL',
  'TIPO',
  'PREÇO',
  'STATUS',
  'CORRETOR',
  'ATUALIZADO',
  'AÇÕES',
]

export const dashboardPropertyTableGridColumns =
  'minmax(420px, 2.35fr) minmax(170px, 0.9fr) minmax(190px, 1fr) minmax(165px, 0.85fr) minmax(205px, 1fr) minmax(180px, 0.9fr) minmax(130px, 0.65fr)'

export const dashboardPropertyTabs: DashboardPropertyDetailTab[] = [
  'Dados',
  'Mídia',
  'Valores',
  'Histórico',
]

export const createPropertySteps: Array<{ key: CreatePropertyStepKey; label: string }> = [
  { key: 'basic', label: 'Dados Básicos' },
  { key: 'address', label: 'Endereço' },
  { key: 'features', label: 'Características' },
  { key: 'media', label: 'Mídia' },
  { key: 'values', label: 'Valores' },
  { key: 'publishing', label: 'Publicação' },
]

export const createPropertyTypeOptions = [
  'Apartamento',
  'Casa',
  'Studio',
  'Cobertura',
  'Comercial',
] as const

export const createPropertyPurposeOptions = ['Aluguel', 'Venda'] as const

export const createPropertyFeatureOptions = [
  'Mobiliado',
  'Varanda gourmet',
  'Aceita pets',
  'Portaria 24h',
] as const

export const createPropertyMediaSlots = ['Foto principal', 'Galeria', 'Planta baixa'] as const

export const createPropertyPublishingOptions = [
  'Publicar no marketplace após revisão',
  'Permitir contato por WhatsApp',
  'Destacar imóvel na listagem inicial',
] as const
