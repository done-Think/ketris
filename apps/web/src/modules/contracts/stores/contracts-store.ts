import dayjs from 'dayjs'
import { create } from 'zustand'

import { dashboardContracts } from '../config/contracts-data'
import type {
  ContractListItem,
  ContractType,
  ContractsStoreState,
  CreateContractFormValues,
} from '../types/contract'

const fallbackPropertyImageUrl =
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=120&q=80'

function getContractType(values: CreateContractFormValues): ContractType {
  const contractType = values.contractType.toLocaleLowerCase('pt-BR')

  if (contractType.includes('comercial')) return 'Comercial'
  if (contractType.includes('temporada')) return 'Temporada'

  return 'Residencial'
}

function createContractListItem(
  values: CreateContractFormValues,
  contractCount: number,
): ContractListItem {
  const nextContractNumber = String(contractCount + 1).padStart(4, '0')

  return {
    id: `contract-${nextContractNumber}`,
    code: `CTR-${dayjs().format('YYYY')}-${nextContractNumber}`,
    title: values.propertyTitle || values.contractType || 'Contrato em revisao',
    property: values.propertyTitle,
    propertyAddress: values.propertyAddress,
    propertyId: 'apt-jardins-3q',
    propertyImageUrl: fallbackPropertyImageUrl,
    owner: values.ownerName,
    tenant: values.tenantName,
    status: 'Em revisão',
    type: getContractType(values),
    startDate: values.startDate,
    endDate: values.endDate,
    amount: values.monthlyRent,
    adjustment: values.adjustmentIndex,
    paymentDay: `${Number(values.dueDay)} de cada mes`,
    guarantee: values.guaranteeType,
    notes: values.notes,
    paymentHistory: [
      {
        period: dayjs().format('MMMM YYYY'),
        amount: values.monthlyRent,
        status: 'Pendente',
        date: '--',
      },
    ],
    documents: [{ name: `Minuta_${nextContractNumber}.pdf`, sentAt: 'Gerado agora' }],
    updatedAt: 'Agora',
  }
}

export const useContractsStore = create<ContractsStoreState>((set, get) => ({
  contracts: dashboardContracts,
  addContract: (values) => {
    const contract = createContractListItem(values, get().contracts.length)

    set((state) => ({
      contracts: [contract, ...state.contracts],
    }))

    return contract
  },
}))
