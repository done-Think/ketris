import type { Control, FieldPath, UseFormSetValue } from 'react-hook-form'
import type { GridRenderCellParams } from '@mui/x-data-grid'
import type { z } from 'zod'

import type { contractsFiltersSchema } from '../schemas/contracts-filters-schema'
import type { createContractSchema } from '../schemas/create-contract-schema'

export type ContractStatus =
  | 'Rascunho'
  | 'Em revisão'
  | 'Aguardando assinatura'
  | 'Assinado'
  | 'Ativo'
  | 'Encerrado'
  | 'Cancelado'

export type ContractType = 'Residencial' | 'Comercial' | 'Temporada'

export type ContractStatusFilter = 'Todos' | ContractStatus

export type ContractActionMenuKey = 'view' | 'edit' | 'download' | 'send'

export type ContractTableAction =
  | 'view-summary'
  | 'view-history'
  | 'edit-data'
  | 'duplicate'
  | 'download-pdf'
  | 'download-draft'
  | 'send-signature'
  | 'copy-signature-link'

export type ContractActionMenuIconKey =
  'summary' | 'history' | 'edit' | 'duplicate' | 'pdf' | 'draft' | 'send' | 'link'

export type ContractActionMenuOption = {
  action: ContractTableAction
  label: string
  icon: ContractActionMenuIconKey
}

export type ContractActionMockItem = {
  label: string
  value: string
}

export type ContractActionMockSection = {
  title: string
  items: ContractActionMockItem[]
}

export type ContractActionMockContent = {
  title: string
  description: string
  statusLabel: string
  primaryActionLabel: string
  successMessage: string
  sections: ContractActionMockSection[]
}

export type ContractActionDialogState = {
  contract: ContractListItem | null
  action: ContractTableAction | null
}

export type ContractActionHandler = (
  contract: ContractListItem,
  action: ContractTableAction,
) => void

export type ContractMetric = {
  label: string
  value: string
  caption: string
  tone: 'primary' | 'info' | 'warning' | 'success'
}

export type ContractFilterTab = {
  label: string
  status: ContractsFiltersFormValues['status']
  period: ContractsFiltersFormValues['period']
}

export type ContractListItem = {
  id: string
  code: string
  title: string
  property: string
  propertyAddress: string
  propertyImageUrl: string
  propertyId: string
  owner: string
  tenant: string
  status: ContractStatus
  type: ContractType
  startDate: string
  endDate: string
  amount: string
  updatedAt: string
}

export type ContractStatusStyle = {
  bgcolor: string
  color: string
}

export type ContractsFiltersFormValues = z.infer<typeof contractsFiltersSchema>

export type ContractsDashboardPageHeaderProps = {
  control: Control<ContractsFiltersFormValues>
  onCreateContract: () => void
}

export type ContractsSummaryCardsProps = {
  metrics: ContractMetric[]
}

export type ContractsFiltersProps = {
  control: Control<ContractsFiltersFormValues>
  setValue: UseFormSetValue<ContractsFiltersFormValues>
}

export type ContractsTableProps = {
  contracts: ContractListItem[]
  totalCount: number
  onContractAction: ContractActionHandler
  onContractSelect: (contract: ContractListItem) => void
}

export type ContractIdentityCellProps = GridRenderCellParams<ContractListItem>

export type ContractStatusCellProps = {
  status: ContractStatus
}

export type ContractActionsCellProps = {
  contract: ContractListItem
  onContractAction: ContractActionHandler
}

export type ContractActionDialogProps = ContractActionDialogState & {
  onClose: () => void
  onConfirm: () => void
}

export type ContractActionSummaryProps = {
  contract: ContractListItem
}

export type ContractActionSectionProps = {
  section: ContractActionMockSection
}

export type ContractMetricToneStyle = {
  bgcolor: string
  color: string
  borderColor: string
}

export type ContractsEmptyStateProps = {
  onCreateContract: () => void
}

export type ContractsStoreState = {
  contracts: ContractListItem[]
  addContract: (values: CreateContractFormValues) => ContractListItem
}

export type CreateContractStepKey = 'parties' | 'property' | 'conditions' | 'review'

export type CreateContractStep = {
  key: CreateContractStepKey
  label: string
}

export type CreateContractFormValues = z.infer<typeof createContractSchema>

export type CreateContractFieldName = FieldPath<CreateContractFormValues>

export type ContractFieldConfig = {
  name: CreateContractFieldName
  label: string
  mask?: string
  options?: string[]
  /** Translates an option's internal value into display text. Falls back to the raw value. */
  getOptionLabel?: (option: string) => string
  multiline?: boolean
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
  values: CreateContractFormValues
}

export type ContractStepControlProps = Pick<ContractStepFieldsProps, 'control'>

export type ContractPropertyStepProps = Pick<
  ContractStepFieldsProps,
  'control' | 'setValue' | 'values'
>

export type ContractPartiesStepProps = Pick<
  ContractStepFieldsProps,
  'control' | 'setValue' | 'values'
>

export type ContractStepReviewProps = Pick<ContractStepFieldsProps, 'values'>

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
  onPreviousStep: () => void
  onNextStep: () => void
}
