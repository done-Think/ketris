import type { ApiContractStatus, ApiContractType } from './service'
import type { Control, FieldPath, UseFormSetValue } from 'react-hook-form'
import type { GridPaginationModel, GridSortModel, GridRenderCellParams } from '@mui/x-data-grid'
import type { z } from 'zod'
import type { contractsFiltersSchema } from '../schemas/contracts-filters-schema'
import type { createContractSchema } from '../schemas/create-contract-schema'

export type ContractStatus = ApiContractStatus

export type ContractType = ApiContractType

export type ContractStatusFilter = 'ALL' | ContractStatus

export type ContractActionMenuKey = 'view' | 'edit' | 'download'

export type ContractTableAction = 'view-summary' | 'view-history' | 'edit-data' | 'view-documents'

export type ContractActionMenuIconKey = 'summary' | 'history' | 'edit' | 'pdf'

export type ContractActionMenuOption = {
  action: ContractTableAction
  icon: ContractActionMenuIconKey
}

export type ContractActionHandler = (
  contract: ContractListItem,
  action: ContractTableAction,
) => void

export type ContractMetric = {
  label: 'active' | 'expiring30' | 'total'
  value: string
  caption: string
  tone: 'primary' | 'info' | 'warning' | 'success'
}

export type ContractFilterTab = {
  label: 'ALL' | 'active' | 'expiring90' | 'closed'
  status: ContractsFiltersFormValues['status']
  period: ContractsFiltersFormValues['period']
}

export type ContractListItem = {
  canEdit: boolean
  id: string
  code: string
  title: string
  property: string
  propertyAddress: string
  propertyId: string
  owner: string
  tenant: string
  status: ContractStatus
  type: ContractType
  startDate: string
  endDate: string
  amount: string
  adjustment: string
  paymentDay: string
  guarantee: string
  notes: string
  updatedAt: string
}

export type ContractStatusStyle = {
  bgcolor: string
  color: string
}

export type ContractsFiltersFormValues = z.infer<typeof contractsFiltersSchema>

export type ContractsDashboardPageHeaderProps = {
  control: Control<ContractsFiltersFormValues>
  onCreateContract?: () => void
}

export type ContractsSummaryCardsProps = {
  metrics: ContractMetric[]
}

export type ContractsFiltersProps = {
  control: Control<ContractsFiltersFormValues>
  filterCounts: Record<ContractFilterTab['label'], number>
  setValue: UseFormSetValue<ContractsFiltersFormValues>
}

export type ContractsTableProps = {
  contracts: ContractListItem[]
  totalCount: number
  onContractAction: ContractActionHandler
  onContractSelect: (contract: ContractListItem) => void
  readOnly?: boolean
  loading: boolean
  paginationModel: GridPaginationModel
  onPaginationModelChange: (model: GridPaginationModel) => void
  sortModel: GridSortModel
  onSortModelChange: (model: GridSortModel) => void
}

export type ContractDetailDashboardPageProps = {
  contractId: string
}

export type ContractIdentityCellProps = GridRenderCellParams<ContractListItem>

export type ContractStatusCellProps = {
  status: ContractStatus
}

export type ContractActionsCellProps = {
  contract: ContractListItem
  onContractAction: ContractActionHandler
}

export type ContractMetricToneStyle = {
  bgcolor: string
  color: string
  borderColor: string
}

export type ContractsEmptyStateProps = {
  onCreateContract?: () => void
}

export type CreateContractStepKey = 'opportunity' | 'parties' | 'conditions' | 'review'

export type CreateContractStep = {
  key: CreateContractStepKey
}

export type CreateContractFormValues = z.infer<ReturnType<typeof createContractSchema>>

export type CreateContractFieldName = FieldPath<CreateContractFormValues>

export type ContractFieldConfig = {
  name: CreateContractFieldName
  label: string
  mask?: string
  options?: string[]
  getOptionLabel?: (option: string) => string
  multiline?: boolean
}

export type ContractFieldLabelKey =
  | TranslationKey<'contracts.wizard.conditions.fields'>
  | TranslationKey<'contracts.wizard.parties.fields'>

export type ContractFieldMeta<LabelKey extends ContractFieldLabelKey = ContractFieldLabelKey> = {
  name: CreateContractFieldName
  labelKey: LabelKey
  mask?: string
  options?: string[]
  optionsNamespace?: string
}

export type ContractStepsNavProps = {
  activeStepIndex: number
  maxStepIndex: number
  onStepSelect: (stepIndex: number) => void
}

export type ContractStepFieldsProps = {
  activeStepKey: CreateContractStepKey
  control: Control<CreateContractFormValues>
  setValue: UseFormSetValue<CreateContractFormValues>
}

export type ContractStepControlProps = Pick<ContractStepFieldsProps, 'control'>

export type ContractOpportunityStepProps = Pick<ContractStepFieldsProps, 'control' | 'setValue'>

export type ContractPartiesStepProps = Pick<ContractStepFieldsProps, 'control' | 'setValue'>

export type ContractStepReviewProps = Pick<ContractStepFieldsProps, 'control'>

export type ContractFieldProps = {
  control: ContractStepFieldsProps['control']
  field: ContractFieldConfig
}

export type ContractFieldGridProps = {
  control: ContractStepFieldsProps['control']
  fields: ContractFieldConfig[]
}

export type ContractSectionTitleProps = {
  children: string
}

export type ContractReviewItem = {
  label: string
  value: string
}

export type ContractReviewItemProps = ContractReviewItem

export type ContractReviewPanelProps = {
  title: string
  items: ContractReviewItem[]
}

export type ContractActionsProps = {
  lastStep: boolean
  isSubmitting: boolean
  onPreviousStep: () => void
  onNextStep: () => void
}

export interface ContractListPagingState {
  filterKey: string
  model: GridPaginationModel
}

export interface ContractTableState {
  sort: GridSortModel
  paging: ContractListPagingState
}
import type { TranslationKey } from '@/i18n/types/messages.types'
