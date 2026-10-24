import { isPropertyOwner } from '@server/auth/domain/roles'

import type { Papel } from '@server/auth/domain/user.entity'

import { assertCanEditProperties } from '../authorization'
import type { PropertyRepository } from '../ports/property-repository.port'
import type { NewProperty } from '../../types/property'

export class CreatePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  execute(
    input: Omit<NewProperty, 'tenantId' | 'responsavelId'> & {
      actorTenantId: string
      actorUserId: string
      actorPapel: Papel
    },
  ) {
    assertCanEditProperties(input.actorPapel)

    return this.propertyRepository.create({
      tenantId: input.actorTenantId,
      responsavelId: input.actorUserId,
      proprietarioId: isPropertyOwner(input.actorPapel) ? input.actorUserId : null,
      titulo: input.titulo,
      descricao: input.descricao,
      finalidade: input.finalidade,
      tipo: input.tipo,
      quartos: input.quartos,
      banheiros: input.banheiros,
      vagas: input.vagas,
      areaM2: input.areaM2,
      valor: input.valor,
      valorAluguel: input.valorAluguel,
      condominio: input.condominio,
      iptu: input.iptu,
      endereco: input.endereco,
      midias: input.midias,
    })
  }
}
