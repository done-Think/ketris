import type { ContractPresentation } from '../types/presentation'
import type { ApiContract, ApiContractListItem, CreateContractPayload } from '../types/service'
import type { ContractListItem, CreateContractFormValues } from '../types/contract'

export function mapContractListItemFromApi(
  item: ApiContractListItem,
  presentation: ContractPresentation,
): ContractListItem {
  return {
    canEdit: item.canEdit,
    id: item.id,
    code: item.code,
    title: item.propertyTitle,
    property: item.propertyTitle,
    propertyAddress: item.propertyAddress,
    propertyId: item.propertyId,
    owner: item.ownerName ?? '',
    tenant: item.tenantName ?? '',
    status: item.status,
    type: item.type,
    startDate: presentation.date(item.startDate),
    endDate: presentation.date(item.endDate),
    amount: presentation.money(item.amount),
    adjustment: '',
    paymentDay: '',
    guarantee: '',
    notes: '',
    updatedAt: presentation.date(item.updatedAt),
  }
}

export function mapContractFromApi(
  contract: ApiContract,
  presentation: ContractPresentation,
): ContractListItem {
  const owner = contract.parties.find((party) => party.role === 'LOCADOR')
  const tenant = contract.parties.find((party) => party.role === 'LOCATARIO')

  return {
    canEdit:
      ['RASCUNHO', 'EM_REVISAO', 'AGUARDANDO_ASSINATURA'].includes(contract.status) &&
      !contract.parties.some((party) => party.signatureStatus === 'ASSINADA'),
    id: contract.id,
    code: contract.code,
    title: contract.property.title ?? contract.propertyId,
    property: contract.property.title ?? contract.propertyId,
    propertyAddress: contract.property.address ?? '',
    propertyId: contract.propertyId,
    owner: owner?.name ?? '',
    tenant: tenant?.name ?? '',
    status: contract.status,
    type: contract.type,
    startDate: presentation.date(contract.startDate),
    endDate: presentation.date(contract.endDate),
    amount: presentation.money(contract.amount),
    adjustment: presentation.adjustment(contract.adjustmentIndex),
    paymentDay: presentation.paymentDay(contract.dueDay),
    guarantee: presentation.guarantee(contract.guaranteeType),
    notes: contract.notes ?? '',
    updatedAt: presentation.date(contract.updatedAt),
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
    amount: values.amount,
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
      phone: values.ownerPhone.trim(),
    },
    tenant: {
      name: values.tenantName,
      cpf: values.tenantCpf,
      email: values.tenantEmail,
      phone: values.tenantPhone.trim(),
    },
    guarantor: hasGuarantor
      ? {
          name: values.guarantorName,
          cpf: values.guarantorCpf,
          email: values.guarantorEmail,
          phone: values.guarantorPhone.trim(),
        }
      : null,
  }
}
