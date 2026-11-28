export interface LeadContactLinkPort {
  link(leadId: string, contactId: string): Promise<void>
}
