import type { ApiContractStatus } from '../types/service'

export const contractStatusMessageKeys: Record<ApiContractStatus, string> = {
  RASCUNHO: 'draft',
  EM_REVISAO: 'review',
  AGUARDANDO_ASSINATURA: 'awaitingSignature',
  ASSINADO: 'signed',
  ATIVO: 'active',
  ENCERRADO: 'closed',
  CANCELADO: 'cancelled',
}

export const contractOptionMessageKeys: Record<string, Record<string, string>> = {
  contractTypeOptions: {
    RESIDENCIAL: 'residential',
    COMERCIAL: 'commercial',
    TEMPORADA: 'shortTerm',
  },
  guaranteeTypeOptions: {
    FIADOR: 'guarantor',
    CAUCAO: 'deposit',
    SEGURO_FIANCA: 'insurance',
    TITULO_CAPITALIZACAO: 'capitalizationBond',
  },
  adjustmentIndexOptions: { IPCA: 'ipca', IGPM: 'igpm', INPC: 'inpc' },
}

export const contractPartyMessageKeys = {
  LOCADOR: 'landlord',
  LOCATARIO: 'tenant',
  FIADOR: 'guarantor',
} as const
export const contractSignatureMessageKeys = { MANUAL: 'manual', PROVIDER: 'provider' } as const
