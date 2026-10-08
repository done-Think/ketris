import { z } from 'zod'

import { createPhoneSchema } from '@modules/auth/schemas/registration-details-schema'
import { createCpfSchema, isValidCpf } from '@shared/schemas/cpf-schema'
import type { SchemaMessageTranslator } from '@shared/schemas/email-schema'

function addGuarantorTextIssue(
  context: z.RefinementCtx,
  path: string,
  value: string,
  message: string,
) {
  if (value.trim()) return

  context.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] })
}

function addGuarantorCpfIssue(context: z.RefinementCtx, value: string, t: SchemaMessageTranslator) {
  if (isValidCpf(value)) return

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: value.trim() ? t('guarantorCpfInvalid') : t('guarantorCpfRequired'),
    path: ['guarantorCpf'],
  })
}

function addGuarantorPhoneIssue(
  context: z.RefinementCtx,
  value: string,
  t: SchemaMessageTranslator,
) {
  if (createPhoneSchema(t).safeParse(value).success) return

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: value.trim() ? t('guarantorPhoneInvalid') : t('guarantorPhoneRequired'),
    path: ['guarantorPhone'],
  })
}

export function createContractSchema(t: SchemaMessageTranslator) {
  const requiredText = (key: string) => z.string().min(1, t(key))

  return z
    .object({
      activeStepIndex: z.number().int().min(0).default(0),
      maxStepIndex: z.number().int().min(0).max(3).default(0),
      opportunityId: requiredText('opportunityRequired'),
      ownerName: requiredText('ownerNameRequired'),
      ownerCpf: createCpfSchema(t),
      ownerEmail: z.string().email(t('emailInvalid')),
      ownerPhone: createPhoneSchema(t),
      tenantName: requiredText('tenantNameRequired'),
      tenantCpf: createCpfSchema(t),
      tenantEmail: z.string().email(t('emailInvalid')),
      tenantPhone: createPhoneSchema(t),
      hasGuarantor: z.boolean().default(false),
      guarantorName: z.string().default(''),
      guarantorCpf: z.string().default(''),
      guarantorEmail: z.string().default(''),
      guarantorPhone: z.string().default(''),
      contractType: requiredText('contractTypeRequired'),
      dueDay: requiredText('dueDayRequired'),
      startDate: requiredText('startDateRequired'),
      endDate: requiredText('endDateRequired'),
      guaranteeType: requiredText('guaranteeTypeRequired'),
      adjustmentIndex: requiredText('adjustmentIndexRequired'),
      notes: z.string().default(''),
    })
    .superRefine((values, context) => {
      if (!values.hasGuarantor && values.guaranteeType !== 'FIADOR') return

      addGuarantorTextIssue(
        context,
        'guarantorName',
        values.guarantorName,
        t('guarantorNameRequired'),
      )
      addGuarantorCpfIssue(context, values.guarantorCpf, t)
      addGuarantorTextIssue(
        context,
        'guarantorEmail',
        values.guarantorEmail,
        t('guarantorEmailRequired'),
      )
      addGuarantorPhoneIssue(context, values.guarantorPhone, t)

      if (
        values.guarantorEmail.trim() &&
        !z.string().email().safeParse(values.guarantorEmail).success
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('emailInvalid'),
          path: ['guarantorEmail'],
        })
      }
    })
}

export const createContractDefaultValues = {
  activeStepIndex: 0,
  maxStepIndex: 0,
  opportunityId: '',
  ownerName: '',
  ownerCpf: '',
  ownerEmail: '',
  ownerPhone: '',
  tenantName: '',
  tenantCpf: '',
  tenantEmail: '',
  tenantPhone: '',
  hasGuarantor: false,
  guarantorName: '',
  guarantorCpf: '',
  guarantorEmail: '',
  guarantorPhone: '',
  contractType: 'RESIDENCIAL',
  dueDay: '',
  startDate: '',
  endDate: '',
  guaranteeType: '',
  adjustmentIndex: '',
  notes: '',
} satisfies z.infer<ReturnType<typeof createContractSchema>>
