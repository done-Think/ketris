import type { ContractManualSignatureEvidence } from '../types/workflow'
import { registerManualContractSignature } from './register-manual-contract-signature'
import { opportunityScopeWhere, contractReadWhere } from './contract-query'
import { contractInclude } from './contract-query'
import { toDomainContract } from './prisma-contract.mapper'

import { lockContractOpportunity } from './lock-contract-opportunity'
import { listContracts } from './list-contracts'
import { randomUUID } from 'node:crypto'
import type { ContractDataProtector } from '../application/ports/contract-data-protector.port'
import { AesContractDataProtector } from './aes-contract-data-protector'
import { nextContractCode } from './next-contract-code'
import { recordContractAudit } from './contract-audit'
import { prisma } from '@server/db/prisma'

import type { Contract } from '../domain/contract.entity'
import type {
  ContractListFilters,
  ContractListResult,
  ContractManageScope,
  ContractReadScope,
  EligibleOpportunity,
  NewContract,
} from '../types/contract-entity'
import type { ContractRepository } from '../application/ports/contract-repository.port'

export class PrismaContractRepository implements ContractRepository {
  constructor(private readonly protector: ContractDataProtector = new AesContractDataProtector()) {}

  async findEligibleOpportunity(
    tenantId: string,
    opportunityId: string,
    scope: ContractManageScope,
  ): Promise<EligibleOpportunity | null> {
    const opportunity = await prisma.opportunity.findFirst({
      where: { tenantId, id: opportunityId, ...opportunityScopeWhere(scope) },
      select: { id: true, propertyId: true, status: true, contract: { select: { id: true } } },
    })

    if (!opportunity) return null

    return {
      id: opportunity.id,
      propertyId: opportunity.propertyId,
      status: opportunity.status,
      hasContract: opportunity.contract !== null,
    }
  }

  async create(input: NewContract, scope: ContractManageScope): Promise<Contract> {
    const contract = await prisma.$transaction(async (tx) => {
      const opportunity = await lockContractOpportunity(tx, input, scope)
      const created = await tx.contract.create({
        data: {
          tenantId: input.tenantId,
          propertyId: opportunity.propertyId,
          sourceOpportunityId: input.opportunityId,
          code: await nextContractCode(tx, input.tenantId),
          createdById: input.actorId,
          type: input.type,
          amount: input.amount ?? opportunity.proposedValue,
          dueDay: input.dueDay,
          startDate: input.startDate,
          endDate: input.endDate,
          adjustmentIndex: input.adjustmentIndex,
          guaranteeType: input.guaranteeType,
          notes: input.notes,
          status: 'AWAITING_SIGNATURE',
          parties: {
            create: input.parties.map((party) => {
              const id = randomUUID()
              return {
                id,
                role: party.role,
                name: party.name,
                cpf: this.protector.encryptCpf(party.cpf, {
                  tenantId: input.tenantId,
                  partyId: id,
                }),
                email: party.email,
                phone: party.phone,
                signature: { create: {} },
              }
            }),
          },
        },
        include: contractInclude,
      })
      await recordContractAudit(tx, {
        tenantId: input.tenantId,
        contractId: created.id,
        actorUserId: input.actorId,
        action: 'CREATED',
        toStatus: created.status,
      })
      return created
    })

    return toDomainContract(contract, this.protector)
  }

  async findMany(
    filters: ContractListFilters,
    scope: ContractReadScope,
  ): Promise<ContractListResult> {
    return listContracts(filters, scope)
  }

  async findById(contractId: string, scope: ContractReadScope): Promise<Contract | null> {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, ...contractReadWhere(scope) },
      include: contractInclude,
    })

    return contract ? toDomainContract(contract, this.protector) : null
  }

  signParty(
    tenantId: string,
    contractId: string,
    partyId: string,
    actorId: string,
    evidence: ContractManualSignatureEvidence,
    scope: ContractManageScope,
  ): Promise<Contract> {
    return registerManualContractSignature(
      this.protector,
      contractId,
      partyId,
      { tenantId, actorId, ...scope },
      evidence,
    )
  }
}
