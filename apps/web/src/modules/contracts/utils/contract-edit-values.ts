import type { ApiContract, EditContractPayload } from '../types/service'
import type { CreateContractFormValues } from '../types/contract'
import { createContractDefaultValues } from '../schemas/create-contract-schema'
import { contractIsoDateToForm } from './contract-date'
import { buildCreateContractPayload } from './contract-adapter'

export function contractEditValues(contract: ApiContract): CreateContractFormValues {
  const owner = contract.parties.find((party) => party.role === 'LANDLORD')
  const tenant = contract.parties.find((party) => party.role === 'RENTER')
  const guarantor = contract.parties.find((party) => party.role === 'GUARANTOR')
  return {
    ...createContractDefaultValues,
    opportunityId: contract.opportunityId,
    amount: contract.amount,
    contractType: contract.type,
    dueDay: String(contract.dueDay),
    startDate: contractIsoDateToForm(contract.startDate),
    endDate: contractIsoDateToForm(contract.endDate),
    guaranteeType: contract.guaranteeType,
    adjustmentIndex: contract.adjustmentIndex,
    notes: contract.notes ?? '',
    ownerName: owner?.name ?? '',
    ownerCpf: owner?.cpf ?? '',
    ownerEmail: owner?.email ?? '',
    ownerPhone: owner?.phone ?? '',
    tenantName: tenant?.name ?? '',
    tenantCpf: tenant?.cpf ?? '',
    tenantEmail: tenant?.email ?? '',
    tenantPhone: tenant?.phone ?? '',
    hasGuarantor: Boolean(guarantor),
    guarantorName: guarantor?.name ?? '',
    guarantorCpf: guarantor?.cpf ?? '',
    guarantorEmail: guarantor?.email ?? '',
    guarantorPhone: guarantor?.phone ?? '',
  }
}

export function buildEditContractPayload(values: CreateContractFormValues): EditContractPayload {
  const payload = buildCreateContractPayload(values)
  return {
    type: payload.type,
    amount: values.amount,
    dueDay: payload.dueDay,
    startDate: payload.startDate,
    endDate: payload.endDate,
    adjustmentIndex: payload.adjustmentIndex,
    guaranteeType: payload.guaranteeType,
    notes: payload.notes,
    owner: payload.owner,
    tenant: payload.tenant,
    guarantor: payload.guarantor,
  }
}
