export type ChargeType = 'RECEIVABLE' | 'PAYABLE'

export type StoredChargeStatus = 'PENDING' | 'PAID' | 'SCHEDULED' | 'CANCELED'

export type ChargeStatus = StoredChargeStatus | 'OVERDUE'

export type NewChargeStatus = Extract<StoredChargeStatus, 'PENDING' | 'SCHEDULED'>

export type ChargeAuditAction =
  'CREATED' | 'UPDATED' | 'PAYMENT_REGISTERED' | 'PAYMENT_REVERSED' | 'CANCELLED' | 'DELETED'

export type ChargeAuditActorType = 'USER' | 'SYSTEM'

export type ChargeEditableField = 'description' | 'type' | 'amount' | 'dueDate'

export type ChargeExportLocale = 'pt-BR' | 'en-US' | 'es-ES'
