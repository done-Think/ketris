import { validationRefinement } from '@server/shared/http/validation-messages'
import '@server/openapi/zod-extend'
import { z } from 'zod'
import { AGENDA_MINIMUM_VISIT_MINUTES } from '@shared/lib/utils/agenda-scheduling'

import { agendaEventKindSchema, agendaEventStatusSchema } from './agenda-event.schema'

const durationMinutesSchema = z.number().int().min(15)
const audienceSchema = z.enum(['SHARED_TEAM', 'ALL_AGENTS', 'ASSIGNED_AGENT'])
const outsideBusinessHoursConfirmed = z.boolean().optional().openapi({
  description: 'Confirmação explícita do aviso de evento fora de 08:00–18:00 (America/Sao_Paulo).',
})

const linkEmailSchema = z.string().trim().max(254).email()
const participantEmailsSchema = z
  .array(linkEmailSchema)
  .max(20)
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
    title: z.string().trim().min(3).max(200),
    kind: agendaEventKindSchema.optional(),
    start: z.coerce.date(),
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
    ...validationRefinement('propertyReferenceRequired'),
    path: ['propertyReference'],
  })
  .refine((value) => value.internal || value.participantName.length >= 2, {
    ...validationRefinement('participantNameRequired'),
    path: ['participantName'],
  })
  .refine((value) => value.internal || value.participantPhone.length >= 1, {
    ...validationRefinement('participantPhoneRequired'),
    path: ['participantPhone'],
  })
  .refine((value) => !value.internal || value.audience !== 'SHARED_TEAM', {
    ...validationRefinement('audienceRequired'),
    path: ['audience'],
  })
  .refine(
    (value) => value.kind !== 'VISIT' || value.durationMinutes >= AGENDA_MINIMUM_VISIT_MINUTES,
    {
      ...validationRefinement('visitDuration'),
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
    title: z.string().trim().min(3).optional(),
    kind: agendaEventKindSchema.nullable().optional(),
    status: agendaEventStatusSchema.optional(),
    cancellationReason: z.string().trim().min(1).max(10000).optional(),
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
    ...validationRefinement('cancellationReasonRequired'),
    path: ['cancellationReason'],
  })
  .refine((value) => value.cancellationReason === undefined || value.status === 'CANCELLED', {
    ...validationRefinement('cancellationStatusRequired'),
    path: ['cancellationReason'],
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    ...validationRefinement('updateRequired'),
  })
  .openapi('UpdateAgendaEventRequest')

export const rescheduleAgendaEventRequestSchema = z
  .object({
    outsideBusinessHoursConfirmed,
    start: z.coerce.date(),
    durationMinutes: durationMinutesSchema.optional(),
  })
  .strict()
  .openapi('RescheduleAgendaEventRequest')

export const listAgendaEventsQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
    responsibleId: z.string().trim().min(1).optional(),
  })
  .strict()
  .refine((value) => value.to > value.from, {
    ...validationRefinement('periodEndAfterStart'),
    path: ['to'],
  })
  .openapi('ListAgendaEventsQuery')

export const cancelAgendaEventRequestSchema = z
  .object({ reason: z.string().trim().min(1).max(10000) })
  .strict()
  .openapi('CancelAgendaEventRequest')
