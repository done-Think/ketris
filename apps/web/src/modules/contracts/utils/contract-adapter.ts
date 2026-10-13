import { formatCurrency, formatDate } from '@shared/lib/utils/format'

import type { ApiContract, ApiContractListItem, CreateContractPayload } from '../types/service'
import type {
  ContractListItem,
  ContractStatus,
  ContractType,
  CreateContractFormValues,
} from '../types/contract'

const statusLabels: Record<ApiContract['status'], ContractStatus> = {
  RASCUNHO: 'Rascunho',
  EM_REVISAO: 'Em revisão',
  AGUARDANDO_ASSINATURA: 'Aguardando assinatura',
  ASSINADO: 'Assinado',
  ATIVO: 'Ativo',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
}

const typeLabels: Record<ApiContract['type'], ContractType> = {
  RESIDENCIAL: 'Residencial',
  COMERCIAL: 'Comercial',
  TEMPORADA: 'Temporada',
}

const adjustmentIndexLabels: Record<ApiContract['adjustmentIndex'], string> = {
  IPCA: 'IPCA',
  IGPM: 'IGP-M',
  INPC: 'INPC',
}

const guaranteeTypeLabels: Record<ApiContract['guaranteeType'], string> = {
  FIADOR: 'Fiador',
  CAUCAO: 'Caução',
  SEGURO_FIANCA: 'Seguro fiança',
  TITULO_CAPITALIZACAO: 'Título de capitalização',
}

const fallbackPropertyImageUrl =
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=120&q=80'

export function mapContractStatusToLabel(status: ApiContract['status']): ContractStatus {
  return statusLabels[status]
}

export function mapContractTypeToLabel(type: ApiContract['type']): ContractType {
  return typeLabels[type]
}

export function mapAdjustmentIndexToLabel(index: ApiContract['adjustmentIndex']): string {
  return adjustmentIndexLabels[index]
}

export function mapGuaranteeTypeToLabel(type: ApiContract['guaranteeType']): string {
  return guaranteeTypeLabels[type]
}

export function mapContractListItemFromApi(item: ApiContractListItem): ContractListItem {
  return {
    id: item.id,
    code: item.code,
    title: item.propertyTitle,
    property: item.propertyTitle,
    propertyAddress: item.propertyAddress,
    propertyImageUrl: fallbackPropertyImageUrl,
    propertyId: item.propertyId,
    owner: item.ownerName ?? '',
    tenant: item.tenantName ?? '',
    status: mapContractStatusToLabel(item.status),
    type: mapContractTypeToLabel(item.type),
    startDate: formatDate(item.startDate),
    endDate: formatDate(item.endDate),
    amount: formatCurrency(item.amount),
    adjustment: '',
    paymentDay: '',
    guarantee: '',
    notes: '',
    paymentHistory: [],
    documents: [],
    updatedAt: formatDate(item.updatedAt),
  }
}

export function mapContractFromApi(
  contract: ApiContract,
  property: { title: string; address: string } | undefined,
): ContractListItem {
  const owner = contract.parties.find((party) => party.role === 'LOCADOR')
  const tenant = contract.parties.find((party) => party.role === 'LOCATARIO')

  return {
    id: contract.id,
    code: contract.code,
    title: property?.title ?? contract.propertyId,
    property: property?.title ?? contract.propertyId,
    propertyAddress: property?.address ?? '',
    propertyImageUrl: fallbackPropertyImageUrl,
    propertyId: contract.propertyId,
    owner: owner?.name ?? '',
    tenant: tenant?.name ?? '',
    status: mapContractStatusToLabel(contract.status),
    type: mapContractTypeToLabel(contract.type),
    startDate: formatDate(contract.startDate),
    endDate: formatDate(contract.endDate),
    amount: formatCurrency(contract.amount),
    adjustment: mapAdjustmentIndexToLabel(contract.adjustmentIndex),
    paymentDay: `Dia ${contract.dueDay} de cada mês`,
    guarantee: mapGuaranteeTypeToLabel(contract.guaranteeType),
    notes: contract.notes ?? '',
    paymentHistory: [],
    documents: contract.documents.map((document) => ({
      name: document.name,
      sentAt: formatDate(document.createdAt),
    })),
    updatedAt: formatDate(contract.updatedAt),
  }
}

function parseBrDate(value: string): string {
  const [day, month, year] = value.split('/')
  return `${year}-${month}-${day}`
}

export function buildCreateContractPayload(
  values: CreateContractFormValues,
): CreateContractPayload {
  const hasGuarantor = values.hasGuarantor || values.guaranteeType === 'FIADOR'

  return {
    opportunityId: values.opportunityId,
    type: values.contractType as ApiContract['type'],
    dueDay: Number(values.dueDay),
    startDate: parseBrDate(values.startDate),
    endDate: parseBrDate(values.endDate),
    adjustmentIndex: values.adjustmentIndex as ApiContract['adjustmentIndex'],
    guaranteeType: values.guaranteeType as ApiContract['guaranteeType'],
    notes: values.notes.trim() || null,
    owner: {
      name: values.ownerName,
      cpf: values.ownerCpf,
      email: values.ownerEmail,
      phone: values.ownerPhone || null,
    },
    tenant: {
      name: values.tenantName,
      cpf: values.tenantCpf,
      email: values.tenantEmail,
      phone: values.tenantPhone || null,
    },
    guarantor: hasGuarantor
      ? {
          name: values.guarantorName,
          cpf: values.guarantorCpf,
          email: values.guarantorEmail,
          phone: values.guarantorPhone || null,
        }
      : null,
  }
}
