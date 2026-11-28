import { BaseService } from '@shared/lib/api/base-service'
import type {
  CompleteInteractionPayload,
  InteractionPage,
  InteractionResponse,
  InteractionTarget,
  StartInteractionPayload,
} from '../types/interaction'

class InteractionService extends BaseService {
  list(target: InteractionTarget, page: number): Promise<InteractionPage> {
    const resource = { lead: 'leads', contact: 'contacts', opportunity: 'opportunities' }[
      target.kind
    ]
    return this.http.get<InteractionPage>(`/crm/${resource}/${target.id}/interactions`, {
      params: { page, pageSize: 5 },
    })
  }
  start(leadId: string, payload: StartInteractionPayload) {
    return this.http
      .post<InteractionResponse>(`/crm/leads/${leadId}/interactions`, payload)
      .then((data) => data.interaction)
  }
  startContact(contactId: string, payload: StartInteractionPayload) {
    return this.http
      .post<InteractionResponse>(`/crm/contacts/${contactId}/interactions`, payload)
      .then((data) => data.interaction)
  }
  complete(id: string, payload: CompleteInteractionPayload) {
    return this.http
      .patch<InteractionResponse>(`/crm/interactions/${id}`, payload)
      .then((data) => data.interaction)
  }
}
export const interactionService = new InteractionService()
