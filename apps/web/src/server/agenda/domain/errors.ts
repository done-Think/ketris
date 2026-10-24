import { AppError, ConflictError, ForbiddenError, NotFoundError } from '@server/shared/errors'

export class AgendaRenterPropertyRequiredError extends ConflictError {
  constructor() {
    super('Escolha o imóvel do seu contrato de locação para agendar o evento.')
  }
}

export class AgendaRenterLinksForbiddenError extends ForbiddenError {
  constructor() {
    super('Locatários não vinculam outras pessoas a eventos da agenda.')
  }
}

/**
 * Same status, code and message for every reason (unknown e-mail, inactive user, staff from
 * another tenant), so the response never reveals whether or why an account can't be linked.
 */
export class AgendaEventUserLinkUnavailableError extends AppError {
  constructor(email: string) {
    super(`Não foi possível vincular o e-mail ${email} a este evento.`, {
      status: 400,
      code: 'AGENDA_EVENT_USER_LINK_UNAVAILABLE',
    })
  }
}

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
    super('Visitas devem ter duração mínima de 30 minutos.', {
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
    super(
      'O período deste evento está fora do horário comercial (08:00–18:00). Confirme para continuar.',
      {
        status: 409,
        code: 'AGENDA_OUTSIDE_BUSINESS_HOURS',
      },
    )
  }
}

export class AgendaPropertyVisitConflictError extends ConflictError {
  constructor() {
    super('Já existe uma visita reservada para este imóvel nesse período.')
  }
}
