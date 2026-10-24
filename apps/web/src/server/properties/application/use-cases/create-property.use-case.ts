import { assertPropertyMediaScope } from '../../domain/property-media-policy'
import type { PropertyOwnerDirectory } from '../ports/property-owner-directory.port'
import { PropertyOwnerValidationError } from '../../domain/errors'
import type { CreatePropertyInput } from '../../types/use-case-inputs'
import { isPropertyOwner } from '@server/auth/domain/roles'

import { assertCanEditProperties } from '../authorization'
import type { PropertyRepository } from '../ports/property-repository.port'

export class CreatePropertyUseCase {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly ownerDirectory: PropertyOwnerDirectory,
  ) {}

  execute(input: CreatePropertyInput) {
    assertCanEditProperties(input.actorPapel)
    return this.createProperty(input)
  }

  private async createProperty(input: CreatePropertyInput) {
    assertPropertyMediaScope(input.actorTenantId, input.midias)
    const ownerId = isPropertyOwner(input.actorPapel)
      ? input.actorUserId
      : (input.proprietarioId ?? null)
    if (ownerId && !(await this.ownerDirectory.findActiveOwner(input.actorTenantId, ownerId))) {
      throw new PropertyOwnerValidationError()
    }
    return this.propertyRepository.create({
      tenantId: input.actorTenantId,
      responsavelId: input.actorUserId,
      proprietarioId: ownerId,
      titulo: input.titulo,
      descricao: input.descricao,
      finalidade: input.finalidade,
      tipo: input.tipo,
      anuncio: input.anuncio,
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
