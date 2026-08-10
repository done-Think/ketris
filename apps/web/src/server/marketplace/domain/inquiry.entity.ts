export type InquiryStatus = 'ENVIADA'

export interface NewInquiry {
  tenantId: string
  imovelId: string
  interessadoNome: string
  interessadoEmail: string
  interessadoTelefone: string | null
  valorProposto: number
  observacoes: string | null
}

export interface CreatedInquiry {
  id: string
  imovelId: string
  status: InquiryStatus
  createdAt: Date
}
