import type { useFormatter } from 'next-intl'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { TextFieldProps } from '@mui/material'
import type { Property, PropertyListing } from './property'
import type { GridSortModel, GridPaginationModel, GridRenderCellParams } from '@mui/x-data-grid'
import type { FormEventHandler, ReactNode } from 'react'
import type { Control, FieldErrors, UseFormTrigger } from 'react-hook-form'
import type { z } from 'zod'

import type { createDashboardPropertySchema } from '../schemas/create-dashboard-property-schema'
import type { PropertyStatus as ApiPropertyStatus } from './property'

export type DashboardPropertyStatus =
  'available' | 'rented' | 'sold' | 'active' | 'inReview' | 'expiring' | 'inactive'

export type DashboardPropertyFilterKey =
  'all' | 'available' | 'rented' | 'sold' | 'inReview' | 'inactive'

export type DashboardPropertyDetailTab = 'data' | 'media' | 'values' | 'history'

export type CreatePropertyStepKey =
  'basic' | 'address' | 'features' | 'media' | 'values' | 'publishing'

export type CreatePropertyPurpose = 'RENT' | 'SALE'

export type DashboardActivityTone = 'success' | 'accent' | 'info' | 'warning' | 'neutral' | 'error'

export type CreateDashboardPropertyFormValues = z.infer<
  ReturnType<typeof createDashboardPropertySchema>
>

export type PropertiesDashboardFiltersState = {
  sortModel: GridSortModel
  page: number
  pageSize: number
  activeStatusFilter: DashboardPropertyFilterKey
  searchQuery: string
}

export type DashboardProperty = {
  activeContractId?: string | null
  id: string
  responsibleUserId: string
  apiStatus: ApiPropertyStatus
  title: string
  description: string | null
  listing: PropertyListing
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
    kind: 'photo' | 'floorPlan' | 'video'
  }>
  summary: {
    bedrooms: string
    bathrooms: string
    parkingSpaces: string
    area: string
    condominium: string
    propertyTax: string
  }
  pricing: {
    rent: string
    sale: string
    condominium: string
    propertyTax: string
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

export type EditPropertyDashboardPageProps = {
  propertyId: string
}

export type PropertyNavigationHandler = (propertyId: string) => void

export type PropertiesDashboardHeaderProps = {
  readOnly?: boolean
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
  sortModel: GridSortModel
  onSortChange: (model: GridSortModel) => void
  page: number
  pageSize: number
  inventoryCount: number
  onPaginationChange: (model: GridPaginationModel) => void
  readOnly?: boolean
  properties: DashboardProperty[]
  totalCount: number
  onPropertySelect: PropertyNavigationHandler
  onCreateProperty: () => void
}

export type CreatePropertyStepsNavProps = {
  activeStepIndex: number
  maxVisitedStepIndex: number
  onStepSelect: (stepIndex: number) => void
}

export type CreatePropertyStepFieldsProps = {
  onAddressChange: () => void
  control: Control<CreateDashboardPropertyFormValues>
  activeStepKey: CreatePropertyStepKey
  activeStepLabel: string
  propertyPurpose: CreatePropertyPurpose[]
}

export type CreatePropertyBasicStepFieldsProps = {
  control: Control<CreateDashboardPropertyFormValues>
}

export type CreatePropertyAddressStepFieldsProps = {
  onAddressChange: () => void
  control: Control<CreateDashboardPropertyFormValues>
}

export type CreatePropertyFeaturesStepFieldsProps = {
  control: Control<CreateDashboardPropertyFormValues>
}

export type CreatePropertyValuesStepFieldsProps = {
  control: Control<CreateDashboardPropertyFormValues>
  hasDualPurpose: boolean
  mainValueLabel: 'rentValue' | 'saleValue' | 'referenceValue'
  negotiationTermLabel: 'securityDeposit' | 'commission' | 'commercialTerms'
}

export type PropertyValueFieldName =
  'mainValue' | 'rentalValue' | 'condominium' | 'propertyTax' | 'negotiationTerm'

export type PropertyValueFieldLabel =
  | 'referenceValue'
  | 'rentValue'
  | 'saleValue'
  | 'condominium'
  | 'propertyTax'
  | 'securityDeposit'
  | 'commission'
  | 'commercialTerms'

export type PropertyValueFieldConfig = readonly [
  name: PropertyValueFieldName,
  label: PropertyValueFieldLabel,
  isCurrency: boolean,
]

export type DashboardPropertyMappingMessages = {
  mediaKinds: Record<'photo' | 'floorPlan' | 'video', string>
  notAnnounced: string
  notInformed: string
  unknownAddress: string
  monthlySuffix: string
  purposes: {
    rent: string
    sale: string
  }
  propertyTypes: {
    apartment: string
    house: string
    studio: string
    penthouse: string
    commercial: string
    loft: string
    other: string
  }
  activity: {
    created: string
    published: string
    updated: string
    contractLinked: string
    photosUpdated: string
    markedAsRented: string
    proposalApproved: string
    activatedForSale: string
    documentationSubmitted: string
    listingExpiringSoon: string
    markedAsInactive: string
    priceAdjustment: string
    visitScheduled: string
  }
  pricingDetails: {
    exempt: string
    notApplicable: string
    insuranceDeposit: string
    registrationPaused: string
    installmentsDeposit: string
    feeOnRent: string
    feeOnSale: string
    noRecentAdjustment: string
    underDocumentaryReview: string
    priceValidated: string
    listingExpires: string
    deactivated: string
  }
}

export type PropertyFormatter = Pick<ReturnType<typeof useFormatter>, 'number' | 'relativeTime'>

export type DashboardPropertyMappingOptions = {
  formatter: PropertyFormatter
  locale: AppLocale
  messages: DashboardPropertyMappingMessages
}

export type CreatePropertyPublishingStepFieldsProps = {
  control: Control<CreateDashboardPropertyFormValues>
}

export type CreatePropertyActionsProps = {
  isUploading?: boolean
  firstStep: boolean
  lastStep: boolean
  isSubmitting: boolean
  onPreviousStep: () => void
  onNextStep: () => void
  submitLabel?: string
}

export type PropertyDetailHeaderProps = {
  property: DashboardProperty
  canManage: boolean
  isPublishing: boolean
  isUnpublishing: boolean
  isDeleting: boolean
  onEdit: () => void
  onPublish: () => void
  onUnpublish: () => void
  onDeleteRequest: () => void
}

export type PropertyDetailTabsProps = {
  readOnly?: boolean
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

export type DeletePropertyDialogProps = {
  open: boolean
  isPending: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
}

export type PropertyRowActionsProps = {
  property: DashboardProperty
  onView: () => void
}

export interface PropertyFormLayoutProps {
  isUploading?: boolean
  title: string
  mobileTitle: string
  activeStepIndex: number
  maxVisitedStepIndex: number
  onStepSelect: (stepIndex: number) => void
  onSubmit: FormEventHandler<HTMLFormElement>
  children: ReactNode
}

export interface PropertyMediaUploadFieldProps {
  control: Control<CreateDashboardPropertyFormValues>
}

export interface PropertyMediaDropzoneProps {
  items: CreateDashboardPropertyFormValues['media']
  isUploading: boolean
  onDrop: (files: File[]) => void
  onRemove: (index: number) => void
}

export interface PropertyStatusStyle {
  color: string
  bgcolor: string
}

export interface PropertyFilterOptionLabelProps {
  active: boolean
  count: number
  label: string
}

export type PropertyIdentityCellProps = Pick<GridRenderCellParams<DashboardProperty>, 'row'>

export type PropertyStatusCellProps = PropertyIdentityCellProps & { label: string }

export interface PropertiesEmptyOverlayProps {
  readOnly?: boolean
  emptyInventory: boolean
  onCreateProperty: () => void
}

export interface PropertyFormWizardOptions {
  isUploading?: boolean
  trigger: UseFormTrigger<CreateDashboardPropertyFormValues>
  initialMaxVisitedStepIndex?: number
}
export interface PropertyFormWizardState {
  activeStepIndex: number
  maxVisitedStepIndex: number
}
export type PropertyFormErrors = FieldErrors<CreateDashboardPropertyFormValues>
export interface EditPropertyFormProps {
  property: Property
}
export interface PropertyQueryFeedbackProps {
  loading?: boolean
  onRetry?: () => void
}

export interface PropertyMoneyInputProps {
  name: string
  value: string
  onChange: (event: { target: { name: string; value: string } }) => void
}
export type PropertyMoneyFieldProps = Omit<TextFieldProps, 'value' | 'onChange' | 'type'> & {
  value: number | undefined
  onValueChange: (value: number) => void
}
