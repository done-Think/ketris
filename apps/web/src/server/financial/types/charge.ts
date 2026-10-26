export type ChargeType = 'A_RECEBER' | 'A_PAGAR'

export type StoredChargeStatus = 'PENDENTE' | 'PAGA' | 'AGENDADA' | 'CANCELADA'

export type ChargeStatus = StoredChargeStatus | 'ATRASADA'

export type NewChargeStatus = Extract<StoredChargeStatus, 'PENDENTE' | 'AGENDADA'>

export type ChargeAuditAction =
  'CREATED' | 'UPDATED' | 'PAYMENT_REGISTERED' | 'PAYMENT_REVERSED' | 'CANCELLED' | 'DELETED'

export type ChargeAuditActorType = 'USER' | 'SYSTEM'

export type ChargeEditableField = 'description' | 'type' | 'amount' | 'dueDate'

export type ChargeExportLocale = 'pt-BR' | 'en-US' | 'es-ES'
