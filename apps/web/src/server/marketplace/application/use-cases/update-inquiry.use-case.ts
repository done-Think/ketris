import { InquiryNotFoundError } from '../../domain/errors'
import type { Inquiry, InquiryUpdate } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'

export interface UpdateInquiryInput {
  actorTenantId: string
  inquiryId: string
  changes: InquiryUpdate
}

export type UpdateInquiryOutput = Inquiry

export class UpdateInquiryUseCase {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async execute(input: UpdateInquiryInput): Promise<UpdateInquiryOutput> {
    const inquiry = await this.inquiryRepository.findById(input.inquiryId)

    if (!inquiry || inquiry.tenantId !== input.actorTenantId) {
      throw new InquiryNotFoundError()
    }

    return this.inquiryRepository.update(input.inquiryId, input.changes)
  }
}
