export type ContractStatus =
  | 'RASCUNHO'
  | 'EM_REVISAO'
  | 'AGUARDANDO_ASSINATURA'
  | 'ASSINADO'
  | 'ATIVO'
  | 'ENCERRADO'
  | 'CANCELADO'

export type ContractType = 'RESIDENCIAL' | 'COMERCIAL' | 'TEMPORADA'

export type AdjustmentIndex = 'IPCA' | 'IGPM' | 'INPC'

export type ContractGuaranteeType = 'FIADOR' | 'CAUCAO' | 'SEGURO_FIANCA' | 'TITULO_CAPITALIZACAO'

export type ContractPartyRole = 'LOCADOR' | 'LOCATARIO' | 'FIADOR'

export type SignatureStatus = 'PENDENTE' | 'ASSINADA'
