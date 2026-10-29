import type {
  ContractActionMenuKey,
  ContractActionMenuOption,
  ContractFilterTab,
  ContractStatus,
  ContractType,
  ContractsFiltersFormValues,
  CreateContractStep,
} from '../types/contract'

export const createContractSteps: CreateContractStep[] = [
  { key: 'opportunity' },
  { key: 'parties' },
  { key: 'conditions' },
  { key: 'review' },
]

export const contractStatusOptions: ContractStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'AWAITING_SIGNATURE',
  'SIGNED',
  'ACTIVE',
  'CLOSED',
  'CANCELED',
]

export const contractTypeOptions: ContractType[] = ['RESIDENTIAL', 'COMMERCIAL', 'SEASONAL']

export const contractTypeFilterOptions: Array<ContractsFiltersFormValues['type']> = [
  'ALL',
  ...contractTypeOptions,
]

export const contractPeriodOptions = ['ALL', 'THIS_MONTH', 'NEXT_90_DAYS'] as const

export const contractFilterTabs: ContractFilterTab[] = [
  { label: 'ALL', status: 'ALL', period: 'ALL' },
  { label: 'active', status: 'ACTIVE', period: 'ALL' },
  { label: 'expiring90', status: 'ALL', period: 'NEXT_90_DAYS' },
  { label: 'closed', status: 'CLOSED', period: 'ALL' },
]

export const contractActionMenuOptions: Record<ContractActionMenuKey, ContractActionMenuOption[]> =
  {
    view: [
      { action: 'view-summary', icon: 'summary' },
      { action: 'view-history', icon: 'history' },
    ],
    edit: [{ action: 'edit-data', icon: 'edit' }],
    download: [{ action: 'view-documents', icon: 'pdf' }],
  }
