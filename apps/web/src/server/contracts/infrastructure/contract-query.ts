export const userReferenceSelect = { select: { id: true, name: true } } as const

export const contractInclude = {
  property: {
    select: {
      title: true,
      address: { select: { street: true, neighborhood: true, city: true } },
    },
  },
  activatedBy: userReferenceSelect,
  createdBy: userReferenceSelect,
  canceledBy: userReferenceSelect,
  closedBy: userReferenceSelect,
  parties: { include: { signature: { include: { signedBy: userReferenceSelect } } } },
  documents: { include: { uploadedBy: userReferenceSelect } },
} as const

import type { Prisma } from '@prisma/client'
import type { ContractManageScope, ContractReadScope } from '../types/contract-entity'

export function opportunityScopeWhere(scope: ContractManageScope) {
  return scope.responsibleId ? { responsibleId: scope.responsibleId } : {}
}

function contractScopeWhere(scope: ContractManageScope): Prisma.ContractWhereInput {
  return scope.responsibleId
    ? {
        OR: [
          { property: { responsibleId: scope.responsibleId } },
          { sourceOpportunity: { responsibleId: scope.responsibleId } },
        ],
      }
    : {}
}

export function contractReadWhere(scope: ContractReadScope): Prisma.ContractWhereInput {
  if (scope.kind === 'party') {
    return {
      parties: {
        some: {
          role: 'RENTER',
          userId: scope.userId,
          user: { active: true, role: 'RENTER' },
        },
      },
    }
  }

  if (scope.kind === 'propertyOwner') {
    return { tenantId: scope.tenantId, property: { ownerId: scope.ownerId } }
  }

  return { tenantId: scope.tenantId, ...contractScopeWhere(scope) }
}
