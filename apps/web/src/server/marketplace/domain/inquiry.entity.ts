export type InquiryStatus = 'RASCUNHO' | 'ENVIADA' | 'EM_NEGOCIACAO' | 'ACEITA' | 'RECUSADA'

export type GuaranteeType = 'FIADOR' | 'CAUCAO' | 'SEGURO_FIANCA' | 'NENHUMA'

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

export function toCreatedInquiry(inquiry: Inquiry): CreatedInquiry {
  return {
    id: inquiry.id,
    propertyId: inquiry.propertyId,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
  }
}
