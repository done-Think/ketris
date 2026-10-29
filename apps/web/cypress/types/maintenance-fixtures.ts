export interface MaintenanceFixtureInput {
  suffix: string
  password: string
}
export interface MaintenanceFixtureResult {
  tenantIds: string[]
  ownerEmail: string
  renterEmail: string
  ticketId: string
  propertyTitle: string
  contractCode: string
}
export interface MaintenanceEvidence {
  providerName: string | null
  providerId: string | null
  attachmentCount: number
  uploadId: string | null
  status: string
  actions: (string | null)[]
}
