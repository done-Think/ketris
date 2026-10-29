import { AppError } from '@server/shared/errors'

export class ChargeNotFoundError extends AppError {
  constructor() {
    super('Cobrança não encontrada.', { status: 404, code: 'CHARGE_NOT_FOUND' })
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

export class ChargeNotPaidError extends AppError {
  constructor() {
    super('Só uma cobrança paga pode ter o pagamento estornado.', {
      status: 409,
      code: 'CHARGE_NOT_PAID',
    })
  }
}

export class ChargeLockedError extends AppError {
  constructor() {
    super('Cobrança paga ou cancelada só permite alterar a descrição.', {
      status: 409,
      code: 'CHARGE_LOCKED',
    })
  }
}

export class ChargeHasMovementError extends AppError {
  constructor() {
    super('Só é possível excluir cobrança pendente ou agendada que nunca teve movimento.', {
      status: 409,
      code: 'CHARGE_HAS_MOVEMENT',
    })
  }
}

export class ChargeConcurrentChangeError extends AppError {
  constructor() {
    super('A cobrança foi alterada por outra pessoa. Recarregue e tente de novo.', {
      status: 409,
      code: 'CHARGE_CONCURRENT_CHANGE',
    })
  }
}

export class ChargeReceiptNotFoundError extends AppError {
  constructor() {
    super('Comprovante não encontrado.', { status: 404, code: 'CHARGE_RECEIPT_NOT_FOUND' })
  }
}

export class ChargeReceiptInvalidError extends AppError {
  constructor() {
    super('O arquivo enviado não corresponde ao comprovante informado.', {
      status: 422,
      code: 'CHARGE_RECEIPT_INVALID',
    })
  }
}

export class ChargeReceiptStorageUnavailableError extends AppError {
  constructor() {
    super('Serviço de comprovantes indisponível.', {
      status: 503,
      code: 'CHARGE_RECEIPT_STORAGE_UNAVAILABLE',
    })
  }
}

export class ChargeReceiptUploadExpiredError extends AppError {
  constructor() {
    super('A autorização de envio expirou. Envie o comprovante novamente.', {
      status: 409,
      code: 'CHARGE_RECEIPT_UPLOAD_EXPIRED',
    })
  }
}

export class ChargeReceiptUploadInvalidError extends AppError {
  constructor() {
    super('Autorização de envio inválida.', { status: 400, code: 'CHARGE_RECEIPT_UPLOAD_INVALID' })
  }
}
