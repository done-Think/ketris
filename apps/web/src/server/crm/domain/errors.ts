import { AppError } from '@server/shared/errors'

import type { OpportunityStatus } from './opportunity.entity'

export class OpportunityNotFoundError extends AppError {
  constructor() {
    super('Oportunidade não encontrada.', {
      status: 404,
      code: 'OPPORTUNITY_NOT_FOUND',
    })
  }
}

export class InvalidStatusTransitionError extends AppError {
  constructor(from: OpportunityStatus, to: OpportunityStatus) {
    super(`Não é possível mover a oportunidade de ${from} para ${to}.`, {
      status: 409,
      code: 'INVALID_STATUS_TRANSITION',
    })
  }
}

export class OpportunityNotAnswerableError extends AppError {
  constructor(status: OpportunityStatus) {
    super(`Não é possível responder a uma oportunidade com status ${status}.`, {
      status: 409,
      code: 'OPPORTUNITY_NOT_ANSWERABLE',
    })
  }
}

export class ContactNotFoundError extends AppError {
  constructor() {
    super('Contato não encontrado.', {
      status: 404,
      code: 'CONTACT_NOT_FOUND',
    })
  }
}

export class ContactEmailAlreadyExistsError extends AppError {
  constructor() {
    super('Já existe um contato com este e-mail.', {
      status: 409,
      code: 'CONTACT_EMAIL_ALREADY_EXISTS',
    })
  }
}

export class OpportunityPropertyNotFoundError extends AppError {
  constructor() {
    super('Imóvel não encontrado neste tenant.', {
      status: 404,
      code: 'OPPORTUNITY_PROPERTY_NOT_FOUND',
    })
  }
}

export class LeadNotFoundError extends AppError {
  constructor() {
    super('Lead não encontrado.', {
      status: 404,
      code: 'LEAD_NOT_FOUND',
    })
  }
}

export class LeadAlreadyConvertedError extends AppError {
  constructor() {
    super('Este lead já foi convertido em oportunidade.', {
      status: 409,
      code: 'LEAD_ALREADY_CONVERTED',
    })
  }
}

export class LeadEmailRequiredError extends AppError {
  constructor() {
    super('Informe um e-mail válido antes de converter o lead.', {
      status: 400,
      code: 'LEAD_EMAIL_REQUIRED',
    })
  }
}

export class OpportunityLinkedToContractError extends AppError {
  constructor() {
    super(
      'Uma oportunidade com contrato vinculado deve ser arquivada para preservar o histórico.',
      { status: 409, code: 'OPPORTUNITY_HAS_CONTRACT' },
    )
  }
}

export class LeadStageLockedError extends AppError {
  constructor() {
    super('O estágio de um lead convertido deve permanecer em Proposta.', {
      status: 409,
      code: 'LEAD_STAGE_LOCKED',
    })
  }
}

export class CrmRecordNotFoundError extends AppError {
  constructor() {
    super('Registro não encontrado no escopo autorizado do CRM.', {
      status: 404,
      code: 'CRM_RECORD_NOT_FOUND',
    })
  }
}

export class InvalidOpportunityResponsibleError extends AppError {
  constructor() {
    super('O responsável precisa ser alguém ativo da equipe.', {
      status: 422,
      code: 'INVALID_OPPORTUNITY_RESPONSIBLE',
    })
  }
}
