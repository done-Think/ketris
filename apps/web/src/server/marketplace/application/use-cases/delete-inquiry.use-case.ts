import { InquiryNotFoundError } from '../../domain/errors'
import type { InquiryRepository } from '../ports/inquiry-repository.port'

export interface DeleteInquiryInput {
  actorTenantId: string
  inquiryId: string
}

export class DeleteInquiryUseCase {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async execute(input: DeleteInquiryInput): Promise<void> {
    const inquiry = await this.inquiryRepository.findById(input.inquiryId)

    if (!inquiry || inquiry.tenantId !== input.actorTenantId) {
      throw new InquiryNotFoundError()
    }

    await this.inquiryRepository.delete(input.inquiryId)
  }
}
