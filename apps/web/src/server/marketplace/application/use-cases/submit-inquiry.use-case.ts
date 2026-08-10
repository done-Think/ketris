import { PropertyNotFoundError } from '../../domain/errors'
import type { CreatedInquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'

export interface SubmitInquiryInput {
  propertyId: string
  interessadoNome: string
  interessadoEmail: string
  interessadoTelefone?: string
  valorProposto?: number
  observacoes?: string
}

export type SubmitInquiryOutput = CreatedInquiry

export class SubmitInquiryUseCase {
  constructor(
    private readonly propertyRepository: PublicPropertyRepository,
    private readonly inquiryRepository: InquiryRepository,
  ) {}

  async execute(input: SubmitInquiryInput): Promise<SubmitInquiryOutput> {
    const property = await this.propertyRepository.findPublishedById(input.propertyId)

    if (!property) {
      throw new PropertyNotFoundError()
    }

    return this.inquiryRepository.create({
      tenantId: property.tenantId,
      imovelId: property.id,
      interessadoNome: input.interessadoNome,
      interessadoEmail: input.interessadoEmail,
      interessadoTelefone: input.interessadoTelefone ?? null,
      valorProposto: input.valorProposto ?? property.valor,
      observacoes: input.observacoes ?? null,
    })
  }
}
