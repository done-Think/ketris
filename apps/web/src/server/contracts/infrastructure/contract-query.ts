export const usuarioRefSelect = { select: { id: true, nome: true } } as const

export const contractInclude = {
  imovel: {
    select: {
      titulo: true,
      endereco: { select: { logradouro: true, bairro: true, cidade: true } },
    },
  },
  ativadoPor: usuarioRefSelect,
  criadoPor: usuarioRefSelect,
  canceladoPor: usuarioRefSelect,
  encerradoPor: usuarioRefSelect,
  partes: { include: { assinatura: { include: { assinadaPor: usuarioRefSelect } } } },
  documentos: { include: { enviadoPor: usuarioRefSelect } },
} as const

import type { Prisma } from '@prisma/client'
import type { ContractManageScope, ContractReadScope } from '../types/contract-entity'

export function opportunityScopeWhere(scope: ContractManageScope) {
  return scope.responsibleId ? { responsavelId: scope.responsibleId } : {}
}

function contractScopeWhere(scope: ContractManageScope): Prisma.ContratoWhereInput {
  return scope.responsibleId
    ? {
        OR: [
          { imovel: { responsavelId: scope.responsibleId } },
          { oportunidadeOrigem: { responsavelId: scope.responsibleId } },
        ],
      }
    : {}
}

export function contractReadWhere(scope: ContractReadScope): Prisma.ContratoWhereInput {
  if (scope.kind === 'party') {
    return {
      partes: {
        some: {
          papel: 'LOCATARIO',
          usuarioId: scope.userId,
          usuario: { ativo: true, papel: 'RENTER' },
        },
      },
    }
  }

  if (scope.kind === 'propertyOwner') {
    return { tenantId: scope.tenantId, imovel: { proprietarioId: scope.ownerId } }
  }

  return { tenantId: scope.tenantId, ...contractScopeWhere(scope) }
}
