import type { z } from 'zod'
import type { LinkLeadContactRequestDTO } from '@shared/types/generated/crm/dto'
import type { DashboardLead } from './lead'
import type { createContactLinkSchema } from '../schemas/contact-link-schema'

export type LinkContactPayload = LinkLeadContactRequestDTO
export type LinkContactFormValues = z.infer<ReturnType<typeof createContactLinkSchema>>
export interface LinkLeadContactDialogProps {
  lead: DashboardLead | null
  onClose: () => void
}
export type LinkLeadContactFormProps = { lead: DashboardLead; onClose: () => void }
