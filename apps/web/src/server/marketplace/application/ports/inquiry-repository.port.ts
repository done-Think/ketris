import type { Inquiry, InquiryUpdate, NewInquiry } from '../../domain/inquiry.entity'

export interface InquiryListFilters {
  status?: Inquiry['status']
  includeArchived?: boolean
}

export interface InquiryRepository {
  create(inquiry: NewInquiry): Promise<Inquiry>
  findManyByTenant(tenantId: string, filters?: InquiryListFilters): Promise<Inquiry[]>
  findById(id: string): Promise<Inquiry | null>
  update(id: string, changes: InquiryUpdate): Promise<Inquiry>
  archive(id: string): Promise<Inquiry>
  delete(id: string): Promise<void>
}
