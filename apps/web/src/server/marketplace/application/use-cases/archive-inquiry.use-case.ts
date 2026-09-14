import { InquiryNotFoundError } from '../../domain/errors'
import type { Inquiry } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'

export interface ArchiveInquiryInput {
  actorTenantId: string
  inquiryId: string
}

export type ArchiveInquiryOutput = Inquiry

export class ArchiveInquiryUseCase {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async execute(input: ArchiveInquiryInput): Promise<ArchiveInquiryOutput> {
    const inquiry = await this.inquiryRepository.findById(input.inquiryId)

    if (!inquiry || inquiry.tenantId !== input.actorTenantId) {
      throw new InquiryNotFoundError()
    }

    return this.inquiryRepository.archive(input.inquiryId)
  }
}
