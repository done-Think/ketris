import type { Inquiry, InquiryStatus } from '../../domain/inquiry.entity'
import type { InquiryRepository } from '../ports/inquiry-repository.port'

export interface ListInquiriesInput {
  actorTenantId: string
  status?: InquiryStatus
  includeArchived?: boolean
}

export type ListInquiriesOutput = Inquiry[]

export class ListInquiriesUseCase {
  constructor(private readonly inquiryRepository: InquiryRepository) {}

  async execute(input: ListInquiriesInput): Promise<ListInquiriesOutput> {
    return this.inquiryRepository.findManyByTenant(input.actorTenantId, {
      status: input.status,
      includeArchived: input.includeArchived,
    })
  }
}
