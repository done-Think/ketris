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

export class AgendaPropertyNotFoundError extends NotFoundError {
  constructor() {
    super('Imóvel não encontrado.')
  }
}

export class AgendaCancellationReasonRequiredError extends AppError {
  constructor() {
    super('Informe o motivo do cancelamento.', {
      status: 400,
      code: 'AGENDA_CANCELLATION_REASON_REQUIRED',
    })
  }
}

export class AgendaEventClosedError extends AppError {
  constructor() {
    super('O resultado deste evento já foi registrado.', {
      status: 409,
      code: 'AGENDA_EVENT_CLOSED',
    })
  }
}

export class AgendaEventChangedError extends ConflictError {
  constructor() {
    super('O evento foi alterado por outra pessoa. Atualize a agenda e tente novamente.')
  }
}

export class AgendaOutcomeBeforeStartError extends AppError {
  constructor() {
    super('O resultado só pode ser registrado depois do início do evento.', {
      status: 409,
      code: 'AGENDA_OUTCOME_BEFORE_START',
    })
  }
}

export class AgendaOutcomeCancelledEventError extends AppError {
  constructor() {
    super('Eventos cancelados não recebem resultado.', {
      status: 409,
      code: 'AGENDA_OUTCOME_CANCELLED_EVENT',
    })
  }
}

export class AgendaNoShowInternalEventError extends AppError {
  constructor() {
    super('Eventos internos não têm cliente para registrar ausência.', {
      status: 400,
      code: 'AGENDA_NO_SHOW_INTERNAL_EVENT',
    })
  }
}

export class AgendaVisitInterestRequiredError extends AppError {
  constructor() {
    super('Informe o interesse do cliente na visita realizada.', {
      status: 400,
      code: 'AGENDA_VISIT_INTEREST_REQUIRED',
    })
  }
}

export class AgendaVisitInterestNotAllowedError extends AppError {
  constructor() {
    super('O interesse do cliente só se aplica a visitas realizadas.', {
      status: 400,
      code: 'AGENDA_VISIT_INTEREST_NOT_ALLOWED',
    })
  }
}
