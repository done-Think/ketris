import type { CreatedInquiry, NewInquiry } from '../../domain/inquiry.entity'

export interface InquiryRepository {
  create(inquiry: NewInquiry): Promise<CreatedInquiry>
}
