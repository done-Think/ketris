export interface ContractFixtureSeedInput {
  suffix: string
  password: string
}
export interface ContractFixtureSeedResult {
  tenantIds: string[]
  ownerEmail: string
  ownerId: string
  ownerName: string
  renterEmail: string
  leadName: string
  propertyId: string
  propertyTitle: string
}
export interface ContractEvidenceResult {
  status: string
  propertyStatus: string
  chargeCount: number
  protectedCpfs: boolean
  signatures: { method: string | null; hash: string | null; author: string | null }[]
  actions: string[]
}
