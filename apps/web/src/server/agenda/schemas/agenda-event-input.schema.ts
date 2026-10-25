import '@server/openapi/zod-extend'
import { z } from 'zod'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'

import { agendaEventKindSchema, agendaEventStatusSchema } from './agenda-event.schema'

const durationMinutesSchema = z.number().int().min(15, 'Informe ao menos 15 minutos.')
const audienceSchema = z.enum(['SHARED_TEAM', 'ALL_AGENTS', 'ASSIGNED_AGENT'])
const outsideBusinessHoursConfirmed = z.boolean().optional().openapi({
  description: 'Confirmação explícita do aviso de evento fora de 08:00–18:00 (America/Sao_Paulo).',
})

const linkEmailSchema = z.string().trim().max(254).email('Informe um e-mail válido.')
const participantEmailsSchema = z
  .array(linkEmailSchema)
  .max(20, 'Informe no máximo 20 participantes.')
  .openapi({
    description:
      'E-mails dos usuários participantes, com acesso de leitura ao evento (RENTER ativo ou ' +
      'membro ativo do tenant do evento). Na edição: omitido mantém, [] remove todos e uma ' +
      'lista substitui os participantes atuais.',
  })

export const createAgendaEventRequestSchema = z
  .object({
    outsideBusinessHoursConfirmed,
    responsibleId: z.string().trim().min(1).optional(),
    audience: audienceSchema.default('SHARED_TEAM'),
    internal: z.boolean().default(false),
    propertyId: z.string().trim().min(1).optional(),
    propertyReference: z.string().trim().min(1).max(500).optional(),
    title: z.string().trim().min(3, 'Informe o título do evento.').max(200),
    kind: agendaEventKindSchema.optional(),
    start: z.coerce.date({ message: 'Informe a data/hora de início.' }),
    durationMinutes: durationMinutesSchema,
    participantName: z.string().trim().max(200).default(''),
    participantPhone: z.string().trim().max(32).default(''),
    notes: z.string().trim().max(10000).optional(),
    ownerEmail: linkEmailSchema.optional().openapi({
      description:
        'E-mail do dono explícito do evento (RENTER ativo ou membro ativo do tenant do evento), ' +
        'que passa a poder consultá-lo.',
    }),
    participantEmails: participantEmailsSchema.optional(),
  })
  .strict()
  .refine((value) => value.internal || Boolean(value.propertyId || value.propertyReference), {
    message: 'Informe o imóvel ou uma referência.',
    path: ['propertyReference'],
  })
  .refine((value) => value.internal || value.participantName.length >= 2, {
    message: 'Informe o nome do participante.',
    path: ['participantName'],
  })
  .refine((value) => value.internal || value.participantPhone.length >= 1, {
    message: 'Informe o telefone do participante.',
    path: ['participantPhone'],
  })
  .refine((value) => !value.internal || value.audience !== 'SHARED_TEAM', {
    message: 'Selecione os corretores destinatários do evento interno.',
    path: ['audience'],
  })
  .refine(
    (value) => value.kind !== 'VISIT' || value.durationMinutes >= AGENDA_MINIMUM_VISIT_MINUTES,
    {
      message: 'Visitas devem ter duração mínima de 30 minutos.',
      path: ['durationMinutes'],
    },
  )
  .openapi('CreateAgendaEventRequest')

export const updateAgendaEventRequestSchema = z
  .object({
    outsideBusinessHoursConfirmed,
    start: z.coerce.date().optional(),
    durationMinutes: durationMinutesSchema.optional(),
    responsibleId: z.string().trim().min(1).optional(),
    audience: audienceSchema.optional(),
    internal: z.boolean().optional(),
    title: z.string().trim().min(3, 'Informe o título do evento.').optional(),
    kind: agendaEventKindSchema.nullable().optional(),
    status: agendaEventStatusSchema.optional(),
    cancellationReason: z
      .string()
      .trim()
      .min(1, 'Informe o motivo do cancelamento.')
      .max(10000)
      .optional(),
    propertyId: z.string().trim().min(1).nullable().optional(),
    propertyReference: z.string().trim().min(1).max(500).nullable().optional(),
    participantName: z.string().trim().optional(),
    participantPhone: z.string().trim().optional(),
    notes: z.string().trim().nullable().optional(),
    ownerEmail: linkEmailSchema.nullable().optional().openapi({
      description: 'Omitido mantém o dono atual, null remove o dono e um e-mail troca o dono.',
    }),
    participantEmails: participantEmailsSchema.optional(),
  })
  .strict()
  .refine((value) => value.status !== 'CANCELLED' || Boolean(value.cancellationReason), {
    message: 'Informe o motivo do cancelamento.',
    path: ['cancellationReason'],
  })
  .refine((value) => value.cancellationReason === undefined || value.status === 'CANCELLED', {
    message: 'O motivo exige status CANCELLED.',
    path: ['cancellationReason'],
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Informe ao menos um campo para atualização.',
  })
  .openapi('UpdateAgendaEventRequest')

export const rescheduleAgendaEventRequestSchema = z
  .object({
    outsideBusinessHoursConfirmed,
    start: z.coerce.date({ message: 'Informe a nova data/hora de início.' }),
    durationMinutes: durationMinutesSchema.optional(),
  })
  .strict()
  .openapi('RescheduleAgendaEventRequest')

export const listAgendaEventsQuerySchema = z
  .object({
    from: z.coerce.date({ message: 'Informe o início do período (from).' }),
    to: z.coerce.date({ message: 'Informe o fim do período (to).' }),
    responsibleId: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine((value) => value.to > value.from, {
    message: '"to" deve ser depois de "from".',
    path: ['to'],
  })
  .openapi('ListAgendaEventsQuery')

export const cancelAgendaEventRequestSchema = z
  .object({ reason: z.string().trim().min(1, 'Informe o motivo do cancelamento.').max(10000) })
  .strict()
  .openapi('CancelAgendaEventRequest')
