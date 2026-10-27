import { PropertyNotFoundError } from '../../domain/errors'
import { toCreatedInquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'
import type { PublicPropertyRepository } from '../ports/public-property-repository.port'
import type { SubmitInquiryInput, SubmitInquiryOutput } from '../../types/use-case-inputs'

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

    const inquiry = await this.inquiryRepository.create({
      tenantId: property.tenantId,
      propertyId: property.id,
      leadName: input.leadName,
      leadEmail: input.leadEmail,
      leadPhone: input.leadPhone ?? null,
      proposedValue: input.proposedValue ?? property.price,
      notes: input.notes ?? null,
    })

    return toCreatedInquiry(inquiry)
  }
}
