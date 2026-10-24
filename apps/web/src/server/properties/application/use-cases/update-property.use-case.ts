import { assertPropertyMediaScope } from '../../domain/property-media-policy'
import { isPropertyOwner } from '@server/auth/domain/roles'
import type { PropertyOwnerDirectory } from '../ports/property-owner-directory.port'
import { PropertyOwnerValidationError } from '../../domain/errors'
import type { UpdatePropertyInput } from '../../types/use-case-inputs'

import { assertCanEditProperties, assertPropertyAccess } from '../authorization'
import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyRepository } from '../ports/property-repository.port'

export class UpdatePropertyUseCase {
  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly ownerDirectory: PropertyOwnerDirectory,
  ) {}

  async execute(input: UpdatePropertyInput) {
    assertCanEditProperties(input.actorPapel)

    const existing = await this.propertyRepository.findByTenantAndId(input.actorTenantId, input.id)

    if (!existing) {
      throw new PropertyNotFoundError()
    }

    assertPropertyAccess(existing, input.actorId, input.actorPapel)

    assertPropertyMediaScope(
      input.actorTenantId,
      input.midias,
      existing.midias.map((media) => media.url),
    )
    const ownerId = isPropertyOwner(input.actorPapel) ? input.actorId : input.proprietarioId
    if (
      ownerId &&
      ownerId !== existing.proprietarioId &&
      !(await this.ownerDirectory.findActiveOwner(input.actorTenantId, ownerId))
    ) {
      throw new PropertyOwnerValidationError()
    }

    const property = await this.propertyRepository.update(input.actorTenantId, input.id, {
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

    if (!property) {
      throw new PropertyNotFoundError()
    }

    return property
  }
}
