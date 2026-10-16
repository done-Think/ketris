export type ChargeType = 'A_RECEBER' | 'A_PAGAR'

export type ChargeStatus = 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'AGENDADA' | 'CANCELADA'

export type NewChargeStatus = Extract<ChargeStatus, 'PENDENTE' | 'AGENDADA'>
