export type InquiryStatus = 'RASCUNHO' | 'ENVIADA' | 'EM_NEGOCIACAO' | 'ACEITA' | 'RECUSADA'

export type GarantiaContratual = 'FIADOR' | 'CAUCAO' | 'SEGURO_FIANCA' | 'NENHUMA'

export interface Inquiry {
  id: string
  tenantId: string
  imovelId: string
  interessadoNome: string
  interessadoEmail: string
  interessadoTelefone: string | null
  valorProposto: number
  prazoContratoMeses: number | null
  inicioPretendido: Date | null
  garantiaContratual: GarantiaContratual
  condicoesEspeciais: string[]
  observacoes: string | null
  status: InquiryStatus
  arquivadaEm: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NewInquiry {
  tenantId: string
  imovelId: string
  interessadoNome: string
  interessadoEmail: string
  interessadoTelefone: string | null
  valorProposto: number
  observacoes: string | null
}

export interface InquiryUpdate {
  interessadoNome?: string
  interessadoEmail?: string
  interessadoTelefone?: string | null
  valorProposto?: number
  prazoContratoMeses?: number | null
  inicioPretendido?: Date | null
  garantiaContratual?: GarantiaContratual
  condicoesEspeciais?: string[]
  observacoes?: string | null
  status?: InquiryStatus
}

export interface CreatedInquiry {
  id: string
  imovelId: string
  status: InquiryStatus
  createdAt: Date
}

export function toCreatedInquiry(inquiry: Inquiry): CreatedInquiry {
  return {
    id: inquiry.id,
    imovelId: inquiry.imovelId,
    status: inquiry.status,
    createdAt: inquiry.createdAt,
  }
}
