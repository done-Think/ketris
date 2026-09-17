import { PropertyNotFoundError } from '../../domain/errors'
import type { PropertyChanges } from '../../domain/property.entity'
import type { PropertyRepository } from '../ports/property-repository.port'

export class UpdatePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  async execute(input: PropertyChanges & { actorTenantId: string; id: string }) {
    const property = await this.propertyRepository.update(input.actorTenantId, input.id, {
      titulo: input.titulo,
      descricao: input.descricao,
      finalidade: input.finalidade,
      tipo: input.tipo,
      quartos: input.quartos,
      banheiros: input.banheiros,
      vagas: input.vagas,
      areaM2: input.areaM2,
      valor: input.valor,
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
