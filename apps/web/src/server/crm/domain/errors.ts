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
