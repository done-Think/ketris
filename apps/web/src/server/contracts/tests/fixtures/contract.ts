import type { Contract } from '../../domain/contract.entity'
import type { ContractParty } from '../../types/contract-entity'

export function contractParty(overrides: Partial<ContractParty> = {}): ContractParty {
  return {
    id: 'party-tenant',
    userId: null,
    role: 'RENTER',
    name: 'Pessoa do contrato',
    cpf: '529.982.247-25',
    email: 'person@example.test',
    phone: '11999999999',
    signatureStatus: 'PENDING',
    signedAt: null,
    signedBy: null,
    signatureMethod: null,
    signatureDocumentId: null,
    signatureDocumentHash: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  }
}

export function contractFixture(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'contract',
    tenantId: 'agency',
    propertyId: 'property',
    property: { title: 'Apartamento', address: 'Rua do contrato' },
    opportunityId: 'opportunity',
    code: 'CTR-2031-0001',
    type: 'RESIDENTIAL',
    amount: 2450.75,
    dueDay: 5,
    startDate: new Date('2031-01-01'),
    endDate: new Date('2032-01-01'),
    adjustmentIndex: 'IPCA',
    guaranteeType: 'DEPOSIT',
    notes: null,
    status: 'AWAITING_SIGNATURE',
    activatedAt: null,
    activatedBy: null,
    createdAt: new Date('2030-12-01'),
    updatedAt: new Date('2030-12-01'),
    dataRevision: 0,
    createdBy: null,
    cancelledAt: null,
    cancelledBy: null,
    cancellationReason: null,
    closedAt: null,
    closedBy: null,
    closingReason: null,
    parties: [
      contractParty({ id: 'party-owner', role: 'LANDLORD', email: 'owner@example.test' }),
      contractParty(),
    ],
    documents: [],
    ...overrides,
  }
}
