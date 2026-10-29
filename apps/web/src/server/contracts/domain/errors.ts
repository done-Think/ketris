import { AppError, ForbiddenError } from '@server/shared/errors'

export class ContractRenterUserNotFoundError extends AppError {
  constructor() {
    super('Conta de locatário ativa não encontrada para este e-mail.', {
      status: 404,
      code: 'CONTRACT_RENTER_USER_NOT_FOUND',
    })
  }
}

export class ContractNotFoundError extends AppError {
  constructor() {
    super('Contrato não encontrado.', {
      status: 404,
      code: 'CONTRACT_NOT_FOUND',
    })
  }
}

export class ContractRenterForbiddenError extends ForbiddenError {
  constructor() {
    super('Locatários não podem gerenciar contratos.')
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

export class ContractEditingLockedError extends AppError {
  constructor() {
    super('O contrato não pode ser editado após a primeira assinatura ou após seu encerramento.', {
      status: 409,
      code: 'CONTRACT_EDITING_LOCKED',
    })
  }
}

export class ContractTransitionNotAllowedError extends AppError {
  constructor() {
    super('O estado atual do contrato não permite essa operação.', {
      status: 409,
      code: 'CONTRACT_TRANSITION_NOT_ALLOWED',
    })
  }
}

export class ContractDocumentNotFoundError extends AppError {
  constructor() {
    super('Documento do contrato não encontrado.', {
      status: 404,
      code: 'CONTRACT_DOCUMENT_NOT_FOUND',
    })
  }
}

export class ContractDocumentOutdatedError extends AppError {
  constructor() {
    super('Envie um novo PDF após alterar os dados do contrato.', {
      status: 409,
      code: 'CONTRACT_DOCUMENT_OUTDATED',
    })
  }
}

export class ContractEvidenceRequiredError extends AppError {
  constructor() {
    super('Selecione um PDF comprobatório enviado ao contrato.', {
      status: 409,
      code: 'CONTRACT_EVIDENCE_REQUIRED',
    })
  }
}

export class ContractDocumentInvalidError extends AppError {
  constructor() {
    super('O arquivo não corresponde a um PDF válido com os dados informados.', {
      status: 400,
      code: 'CONTRACT_DOCUMENT_INVALID',
    })
  }
}
