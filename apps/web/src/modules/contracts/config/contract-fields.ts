import type { ContractFieldMeta, CreateContractFieldName } from '../types/contract'
import { makePartyFieldsMeta } from '../utils/contract-fields'

export const contractTypeOptions = ['RESIDENCIAL', 'COMERCIAL', 'TEMPORADA']

export const guaranteeTypeOptions = ['FIADOR', 'CAUCAO', 'SEGURO_FIANCA', 'TITULO_CAPITALIZACAO']

export const adjustmentIndexOptions = ['IPCA', 'IGPM', 'INPC']

export const conditionsStepFieldsMeta: ContractFieldMeta[] = [
  {
    name: 'contractType',
    labelKey: 'contractType',
    options: contractTypeOptions,
    optionsNamespace: 'contractTypeOptions',
  },
  { name: 'dueDay', labelKey: 'dueDay', mask: '00' },
  {
    name: 'guaranteeType',
    labelKey: 'guaranteeType',
    options: guaranteeTypeOptions,
    optionsNamespace: 'guaranteeTypeOptions',
  },
  { name: 'startDate', labelKey: 'startDate', mask: '00/00/0000' },
  { name: 'endDate', labelKey: 'endDate', mask: '00/00/0000' },
  {
    name: 'adjustmentIndex',
    labelKey: 'adjustmentIndex',
    options: adjustmentIndexOptions,
    optionsNamespace: 'adjustmentIndexOptions',
  },
]

export const opportunityStepFieldNames = ['opportunityId' as const]

export const partiesStepFieldNames = [
  ...makePartyFieldsMeta('owner').map((field) => field.name),
  ...makePartyFieldsMeta('tenant').map((field) => field.name),
  'hasGuarantor' as const,
  ...makePartyFieldsMeta('guarantor').map((field) => field.name),
]

export const conditionsStepFieldNames = [
  'amount' as const,
  ...conditionsStepFieldsMeta.map((field) => field.name),
  'notes' as const,
]

export const stepValidationFields: Record<number, CreateContractFieldName[]> = {
  0: opportunityStepFieldNames,
  1: partiesStepFieldNames,
  2: conditionsStepFieldNames,
  3: [],
}
