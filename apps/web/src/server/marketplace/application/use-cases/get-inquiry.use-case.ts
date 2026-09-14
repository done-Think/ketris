import { InquiryNotFoundError } from '../../domain/errors'
import type { Inquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'

export interface GetInquiryInput {
  actorTenantId: string
  inquiryId: string
}

export type GetInquiryOutput = Inquiry

export class GetInquiryUseCase {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async execute(input: GetInquiryInput): Promise<GetInquiryOutput> {
    const inquiry = await this.inquiryRepository.findById(input.inquiryId)

    if (!inquiry || inquiry.tenantId !== input.actorTenantId) {
      throw new InquiryNotFoundError()
    }

    return inquiry
  }
}
