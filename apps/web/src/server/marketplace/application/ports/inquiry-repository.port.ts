import type { NewInquiry, Inquiry } from '../../domain/inquiry.entity'

/**
 * Deliberately narrow scope: only `create()`, used by the public proposal-submission flow
 * (`SubmitInquiryUseCase`). Listing/detail/update/archive/delete of opportunities — which require
 * an authenticated tenant — live in `src/server/crm/` (see ADR-0002). Kept here only for the
 * public table/route's historical name.
 */
export interface InquiryRepository {
  create(inquiry: NewInquiry): Promise<Inquiry>
}
