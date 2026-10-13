import { AppError } from '@server/shared/errors'

export class ChargeNotFoundError extends AppError {
  constructor() {
    super('Cobrança não encontrada.', {
      status: 404,
      code: 'CHARGE_NOT_FOUND',
    })
  }
}

export class ChargeContractNotFoundError extends AppError {
  constructor() {
    super('Contrato não encontrado neste tenant.', {
      status: 404,
      code: 'CHARGE_CONTRACT_NOT_FOUND',
    })
  }
}

export class ChargeAlreadySettledError extends AppError {
  constructor() {
    super('Esta cobrança já foi paga ou cancelada.', {
      status: 409,
      code: 'CHARGE_ALREADY_SETTLED',
    })
  }
}
