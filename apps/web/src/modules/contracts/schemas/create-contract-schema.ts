import { z } from 'zod'
import { parseContractFormDate } from '../utils/contract-date'
import { createCpfSchema, isValidCpf } from '@shared/schemas/cpf-schema'
import { createPhoneSchema } from '@shared/schemas/phone-schema'
import type { SchemaMessageTranslator } from '@shared/types'
import type { TranslationKey } from '@/i18n/types/messages.types'

function addGuarantorTextIssue(
  context: z.RefinementCtx,
  path: string,
  value: string,
  message: string,
) {
  if (value.trim()) return

  context.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] })
}

function addGuarantorCpfIssue(
  context: z.RefinementCtx,
  value: string,
  t: SchemaMessageTranslator<'guarantorCpfInvalid' | 'guarantorCpfRequired'>,
) {
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
  t: SchemaMessageTranslator<
    'guarantorPhoneInvalid' | 'guarantorPhoneRequired' | 'phoneInvalid' | 'phoneRequired'
  >,
) {
  if (createPhoneSchema(t).safeParse(value).success) return

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: value.trim() ? t('guarantorPhoneInvalid') : t('guarantorPhoneRequired'),
    path: ['guarantorPhone'],
  })
}

export function createContractSchema(
  t: SchemaMessageTranslator<TranslationKey<'contracts.wizard.errors'>>,
) {
  const requiredText = (key: TranslationKey<'contracts.wizard.errors'>) =>
    z.string().trim().min(1, t(key))

  return z
    .object({
      opportunityId: requiredText('opportunityRequired'),
      amount: z.coerce
        .number()
        .min(0.01, t('amountRequired'))
        .max(9999999999.99, t('amountTooLarge'))
        .multipleOf(0.01, t('amountPrecision')),
      ownerName: requiredText('ownerNameRequired').max(200, t('nameTooLong')),
      ownerCpf: createCpfSchema(t),
      ownerEmail: z.string().trim().email(t('emailInvalid')).max(254, t('emailTooLong')),
      ownerPhone: createPhoneSchema(t).refine((phone) => phone.length <= 32, t('phoneTooLong')),
      tenantName: requiredText('tenantNameRequired').max(200, t('nameTooLong')),
      tenantCpf: createCpfSchema(t),
      tenantEmail: z.string().trim().email(t('emailInvalid')).max(254, t('emailTooLong')),
      tenantPhone: createPhoneSchema(t).refine((phone) => phone.length <= 32, t('phoneTooLong')),
      hasGuarantor: z.boolean().default(false),
      guarantorName: z.string().trim().max(200, t('nameTooLong')).default(''),
      guarantorCpf: z.string().default(''),
      guarantorEmail: z.string().trim().max(254, t('emailTooLong')).default(''),
      guarantorPhone: z.string().max(32, t('phoneTooLong')).default(''),
      contractType: requiredText('contractTypeRequired').refine(
        (value) => ['RESIDENTIAL', 'COMMERCIAL', 'SEASONAL'].includes(value),
        t('contractTypeRequired'),
      ),
      dueDay: requiredText('dueDayRequired').refine(
        (value) => /^\d{1,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 31,
        t('dueDayInvalid'),
      ),
      startDate: requiredText('startDateRequired').refine(
        (value) => parseContractFormDate(value) !== null,
        t('dateInvalid'),
      ),
      endDate: requiredText('endDateRequired').refine(
        (value) => parseContractFormDate(value) !== null,
        t('dateInvalid'),
      ),
      guaranteeType: requiredText('guaranteeTypeRequired').refine(
        (value) => ['GUARANTOR', 'DEPOSIT', 'SURETY_BOND', 'CAPITALIZATION_BOND'].includes(value),
        t('guaranteeTypeRequired'),
      ),
      adjustmentIndex: requiredText('adjustmentIndexRequired').refine(
        (value) => ['IPCA', 'IGPM', 'INPC'].includes(value),
        t('adjustmentIndexRequired'),
      ),
      notes: z.string().max(10000, t('notesTooLong')).default(''),
    })
    .superRefine((values, context) => {
      const start = parseContractFormDate(values.startDate)
      const end = parseContractFormDate(values.endDate)
      if (start && end && end <= start)
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('endAfterStart'),
          path: ['endDate'],
        })
      if (!values.hasGuarantor && values.guaranteeType !== 'GUARANTOR') return

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
  opportunityId: '',
  amount: 0,
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
  contractType: 'RESIDENTIAL',
  dueDay: '',
  startDate: '',
  endDate: '',
  guaranteeType: '',
  adjustmentIndex: '',
  notes: '',
} satisfies z.infer<ReturnType<typeof createContractSchema>>
