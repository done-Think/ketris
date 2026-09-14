import type { PropertyRepository } from '../ports/property-repository.port'
import type { NewProperty } from '../../domain/property.entity'

export class CreatePropertyUseCase {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  execute(
    input: Omit<NewProperty, 'tenantId' | 'responsavelId'> & {
      actorTenantId: string
      actorUserId: string
    },
  ) {
    return this.propertyRepository.create({
      tenantId: input.actorTenantId,
      responsavelId: input.actorUserId,
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
  }
}
