import type { Prisma } from '@prisma/client'

import type { ResponsibleLookupPort } from '../application/ports/responsible-lookup.port'
import type { OpportunityResponsible } from '../types/opportunity-responsible'
import type { CrmDatabase } from '../types/prisma'

function activeStaffWhere(tenantId: string): Prisma.UsuarioWhereInput {
  return {
    tenantId,
    ativo: true,
    papel: { in: ['OWNER', 'AGENT'] },
    vinculoAprovadoEm: { not: null },
    OR: [{ conviteEquipe: null }, { conviteEquipe: { aceitoEm: { not: null } } }],
  }
}

export class PrismaResponsibleLookup implements ResponsibleLookupPort {
  constructor(private readonly db: CrmDatabase) {}

  async findActiveStaffName(tenantId: string, userId: string): Promise<string | null> {
    const user = await this.db.usuario.findFirst({
      where: { id: userId, ...activeStaffWhere(tenantId) },
      select: { nome: true },
    })

    return user?.nome ?? null
  }

  async listActiveStaff(tenantId: string): Promise<OpportunityResponsible[]> {
    const users = await this.db.usuario.findMany({
      where: activeStaffWhere(tenantId),
      orderBy: [{ nome: 'asc' }, { id: 'asc' }],
      select: { id: true, nome: true, papel: true },
    })

    return users.flatMap((user) =>
      user.papel === 'OWNER' || user.papel === 'AGENT'
        ? [{ id: user.id, name: user.nome, role: user.papel }]
        : [],
    )
  }
}
