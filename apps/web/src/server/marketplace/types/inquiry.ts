export type InquiryStatus = 'DRAFT' | 'SENT' | 'IN_NEGOTIATION' | 'ACCEPTED' | 'REJECTED'

export type GuaranteeType = 'GUARANTOR' | 'DEPOSIT' | 'SURETY_BOND' | 'NONE'

export interface Inquiry {
  id: string
  tenantId: string
  propertyId: string
  leadName: string
  leadEmail: string
  leadPhone: string | null
  proposedValue: number
  contractTermMonths: number | null
  desiredStartDate: Date | null
  guaranteeType: GuaranteeType
  specialConditions: string[]
  notes: string | null
  status: InquiryStatus
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NewInquiry {
  tenantId: string
  propertyId: string
  leadName: string
  leadEmail: string
  leadPhone: string | null
  proposedValue: number
  notes: string | null
}

export interface CreatedInquiry {
  id: string
  propertyId: string
  status: InquiryStatus
  createdAt: Date
}
