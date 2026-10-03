import { AppError, ConflictError, NotFoundError } from '@server/shared/errors'

export class AgendaEventNotFoundError extends NotFoundError {
  constructor() {
    super('Evento de agenda não encontrado.')
  }
}

export class AgendaResponsibleNotFoundError extends NotFoundError {
  constructor() {
    super('Responsável informado não encontrado neste tenant.')
  }
}

export class AgendaEventConflictError extends ConflictError {
  constructor() {
    super('Já existe um evento agendado para este responsável nesse horário.')
  }
}

export class AgendaVisitMinimumDurationError extends AppError {
  constructor() {
    super('Visitas devem ter duração mínima de 60 minutos.', {
      status: 400,
      code: 'AGENDA_VISIT_MINIMUM_DURATION',
    })
  }
}

export class AgendaMinimumAdvanceNoticeError extends AppError {
  constructor() {
    super('Agende com pelo menos 3 horas de antecedência.', {
      status: 400,
      code: 'AGENDA_MINIMUM_ADVANCE_NOTICE',
    })
  }
}

export class AgendaOutsideBusinessHoursError extends AppError {
  constructor() {
    super('Agende dentro do horário comercial (08:00–18:00).', {
      status: 400,
      code: 'AGENDA_OUTSIDE_BUSINESS_HOURS',
    })
  }
}
