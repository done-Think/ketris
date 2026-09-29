import { AppError } from '@server/shared/errors'

export class ContractNotFoundError extends AppError {
  constructor() {
    super('Contrato não encontrado.', {
      status: 404,
      code: 'CONTRACT_NOT_FOUND',
    })
  }
}

export class OpportunityNotFoundError extends AppError {
  constructor() {
    super('Oportunidade não encontrada.', {
      status: 404,
      code: 'CONTRACT_OPPORTUNITY_NOT_FOUND',
    })
  }
}

export class OpportunityNotAcceptedError extends AppError {
  constructor() {
    super('Só é possível criar um contrato a partir de uma oportunidade aceita.', {
      status: 409,
      code: 'CONTRACT_OPPORTUNITY_NOT_ACCEPTED',
    })
  }
}

export class OpportunityAlreadyHasContractError extends AppError {
  constructor() {
    super('Esta oportunidade já tem um contrato.', {
      status: 409,
      code: 'CONTRACT_OPPORTUNITY_ALREADY_HAS_CONTRACT',
    })
  }
}

export class ContractPartyNotFoundError extends AppError {
  constructor() {
    super('Parte do contrato não encontrada.', {
      status: 404,
      code: 'CONTRACT_PARTY_NOT_FOUND',
    })
  }
}

export class ContractPartyAlreadySignedError extends AppError {
  constructor() {
    super('Esta parte já assinou o contrato.', {
      status: 409,
      code: 'CONTRACT_PARTY_ALREADY_SIGNED',
    })
  }
}

export class GuarantorPartyRequiredError extends AppError {
  constructor() {
    super('Contrato com garantia por fiador exige os dados do fiador.', {
      status: 400,
      code: 'CONTRACT_GUARANTOR_PARTY_REQUIRED',
    })
  }
}
