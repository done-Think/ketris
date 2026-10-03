import { z } from 'zod'

export const agendaOtherPropertyValue = 'other'

export const agendaEventKindOptions = [
  'VISIT',
  'FOLLOW_UP',
  'MEETING',
  'INSPECTION',
  'SIGNATURE',
  'OTHER',
] as const

export const agendaEventFormSchema = z
  .object({
    customProperty: z.string(),
    durationMinutes: z.coerce.number().min(15, 'Informe ao menos 15 minutos'),
    kind: z.enum(agendaEventKindOptions).optional().or(z.literal('')),
    notes: z.string(),
    participant: z.string().min(2, 'Informe o nome da pessoa'),
    phone: z.string().min(14, 'Informe um telefone válido'),
    propertyId: z.string().min(1, 'Selecione o imóvel'),
    scheduledDate: z.string().min(1, 'Informe a data'),
    scheduledTime: z.string().min(1, 'Informe o horário'),
    title: z.string().min(3, 'Informe o título do evento'),
  })
  .superRefine((values, context) => {
    if (values.propertyId === agendaOtherPropertyValue && values.customProperty.trim().length < 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o imóvel ou referência',
        path: ['customProperty'],
      })
    }

    if (values.kind === 'VISIT' && values.durationMinutes < 60) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Visitas devem ter duração mínima de 60 minutos',
        path: ['durationMinutes'],
      })
    }
  })
