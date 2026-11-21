import { BaseService } from '@shared/lib/api/base-service'
import type { LinkContactPayload } from '../types/contact-link'
import type { Lead } from '../types/lead'

class ContactLinkService extends BaseService {
  link(leadId: string, payload: LinkContactPayload) {
    return this.http
      .post<{ lead: Lead }>(`/crm/leads/${leadId}/contact`, payload)
      .then((data) => data.lead)
  }
}
export const contactLinkService = new ContactLinkService()
