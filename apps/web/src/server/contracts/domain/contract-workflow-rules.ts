import { normalizeEmail } from '@server/shared/normalize-email'
import type { Contract } from './contract.entity'
import type { NewContractParty } from '../types/contract-entity'
import type { ContractEditData, ContractEditableState } from '../types/workflow'
import { ContractEditingLockedError, ContractTransitionNotAllowedError } from './errors'

export function assertContractEditable(contract: ContractEditableState) {
  if (
    !['RASCUNHO', 'EM_REVISAO', 'AGUARDANDO_ASSINATURA'].includes(contract.status) ||
    contract.parties.some((party) => party.signatureStatus === 'ASSINADA')
  )
    throw new ContractEditingLockedError()
}

export function assertContractTransition(status: Contract['status'], action: 'CANCEL' | 'CLOSE') {
  if (
    action === 'CLOSE' ? status !== 'ATIVO' : ['ATIVO', 'CANCELADO', 'ENCERRADO'].includes(status)
  )
    throw new ContractTransitionNotAllowedError()
}

function partyValues(party: NewContractParty) {
  return [
    party.role,
    party.name.trim(),
    party.cpf.replace(/\D/g, ''),
    normalizeEmail(party.email),
    party.phone?.replace(/\D/g, '') ?? '',
  ]
}

export function sameContractPartyValues(left: NewContractParty, right: NewContractParty) {
  return JSON.stringify(partyValues(left)) === JSON.stringify(partyValues(right))
}

export function contractChangedFields(contract: Contract, data: ContractEditData): string[] {
  const fields: string[] = []
  for (const field of [
    'type',
    'amount',
    'dueDay',
    'adjustmentIndex',
    'guaranteeType',
    'notes',
  ] as const)
    if (contract[field] !== data[field]) fields.push(field)
  for (const field of ['startDate', 'endDate'] as const)
    if (contract[field].getTime() !== data[field].getTime()) fields.push(field)
  const existingParties = new Map(contract.parties.map((party) => [party.role, party]))
  if (
    contract.parties.length !== data.parties.length ||
    data.parties.some((party) => {
      const existing = existingParties.get(party.role)
      return !existing || !sameContractPartyValues(existing, party)
    })
  )
    fields.push('parties')
  return fields
}
