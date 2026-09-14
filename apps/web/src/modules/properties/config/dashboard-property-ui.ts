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

export const dashboardPropertyTabs: DashboardPropertyDetailTab[] = [
  'data',
  'media',
  'values',
  'history',
]

export const createPropertySteps: Array<{ key: CreatePropertyStepKey }> = [
  { key: 'basic' },
  { key: 'address' },
  { key: 'features' },
  { key: 'media' },
  { key: 'values' },
  { key: 'publishing' },
]

export const createPropertyTypeOptions = ['Apartamento', 'Casa', 'Studio', 'Cobertura', 'Comercial']

export const createPropertyPurposeOptions = ['Aluguel', 'Venda'] as const

export const createPropertyFeatureOptions = [
  'Mobiliado',
  'Varanda gourmet',
  'Aceita pets',
  'Portaria 24h',
]

export const createPropertyMediaSlots = ['Foto principal', 'Galeria', 'Planta baixa']

export const createPropertyPublishingOptions = [
  'Publicar no marketplace após revisão',
  'Permitir contato por WhatsApp',
  'Destacar imóvel na listagem inicial',
]
