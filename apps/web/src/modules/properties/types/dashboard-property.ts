import type { ReactNode } from 'react'
import type { Control } from 'react-hook-form'
import type { z } from 'zod'

import type { createDashboardPropertySchema } from '../schemas/create-dashboard-property-schema'

export type DashboardPropertyStatus =
  'Disponível' | 'Alugado' | 'Ativo' | 'Em análise' | 'Vencendo' | 'Inativo'

export type DashboardPropertyFilterKey =
  'Todos' | 'Disponível' | 'Alugado' | 'Vendido' | 'Em análise' | 'Inativo'

export type DashboardPropertyDetailTab = 'data' | 'media' | 'values' | 'history'

export type CreatePropertyStepKey =
  'basic' | 'address' | 'features' | 'media' | 'values' | 'publishing'

export type CreatePropertyPurpose = 'Aluguel' | 'Venda'

export type DashboardActivityTone = 'success' | 'accent' | 'info' | 'warning' | 'neutral' | 'error'

export type CreateDashboardPropertyFormValues = z.infer<typeof createDashboardPropertySchema>

export type PropertiesDashboardFiltersFormValues = {
  activeStatusFilter: DashboardPropertyFilterKey
  searchQuery: string
}

export type PropertyDetailDashboardFormValues = {
  activeTab: DashboardPropertyDetailTab
}

export type DashboardProperty = {
  id: string
  title: string
  address: string
  location: string
  type: string
  purpose: string
  price: string
  status: DashboardPropertyStatus
  broker: string
  updatedAt: string
  imageUrl: string
  heroImageUrl: string
  media: Array<{
    url: string
    label: string
    kind: 'Foto' | 'Planta' | 'Vídeo'
  }>
  summary: {
    bedrooms: string
    bathrooms: string
    parkingSpaces: string
    area: string
    condominium: string
    iptu: string
  }
  pricing: {
    rent: string
    sale: string
    condominium: string
    iptu: string
    administrationFee: string
    securityDeposit: string
    lastAdjustment: string
  }
  participants: Array<{
    name: string
    role: string
    initials: string
    imageUrl?: string
  }>
  activityHistory: Array<{
    label: string
    date: string
    tone: DashboardActivityTone
  }>
}

export type PropertyDetailDashboardPageProps = {
  propertyId: string
}

export type PropertyNavigationHandler = (propertyId: string) => void

export type PropertiesDashboardHeaderProps = {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onCreateProperty: () => void
}

export type PropertyStatusFiltersProps = {
  activeStatusFilter: DashboardPropertyFilterKey
  statusFilterCounts: Record<DashboardPropertyFilterKey, number>
  onStatusFilterChange: (filter: DashboardPropertyFilterKey) => void
}

export type PropertiesTableProps = {
  properties: DashboardProperty[]
  totalCount: number
  onPropertySelect: PropertyNavigationHandler
}

export type CreatePropertyStepsNavProps = {
  activeStepIndex: number
  onStepSelect: (stepIndex: number) => void
}

export type CreatePropertyStepFieldsProps = {
  control: Control<CreateDashboardPropertyFormValues>
  activeStepKey: CreatePropertyStepKey
  activeStepLabel: string
  propertyPurpose: CreatePropertyPurpose
  onPropertyPurposeChange: (purpose: CreatePropertyPurpose) => void
}

export type CreatePropertyActionsProps = {
  firstStep: boolean
  lastStep: boolean
  onPreviousStep: () => void
  onNextStep: () => void
}

export type PropertyDetailHeaderProps = {
  property: DashboardProperty
}

export type PropertyDetailTabsProps = {
  activeTab: DashboardPropertyDetailTab
  onTabChange: (tab: DashboardPropertyDetailTab) => void
}

export type PropertyDetailMainPanelProps = {
  property: DashboardProperty
  activeTab: DashboardPropertyDetailTab
}

export type PropertyDetailSidebarProps = {
  property: DashboardProperty
}

export type PropertyDetailPanelProps = {
  title: string
  children: ReactNode
}
