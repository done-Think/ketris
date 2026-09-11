import { z } from 'zod'

import { phoneSchema } from '@modules/auth/schemas/registration-details-schema'
import { cpfSchema, isValidCpf } from '@shared/schemas/cpf-schema'

const requiredText = (message: string) => z.string().min(1, message)

/**
 * The guarantor block is only conditionally required (see the `superRefine` below), so its base
 * fields stay as loose strings — `cpfSchema`/`phoneSchema` are applied here instead, once we know
 * the guarantor section is actually active, so an empty/untouched guarantor doesn't fail the rest
 * of the form.
 */
function addGuarantorTextIssue(
  context: z.RefinementCtx,
  path: string,
  value: string,
  message: string,
) {
  if (value.trim()) return

  context.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] })
}

function addGuarantorCpfIssue(context: z.RefinementCtx, value: string) {
  if (isValidCpf(value)) return

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: value.trim() ? 'Informe um CPF válido' : 'Informe o CPF do fiador',
    path: ['guarantorCpf'],
  })
}

function addGuarantorPhoneIssue(context: z.RefinementCtx, value: string) {
  if (phoneSchema.safeParse(value).success) return

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: value.trim() ? 'Informe um telefone válido' : 'Informe o telefone do fiador',
    path: ['guarantorPhone'],
  })
}

export const createContractSchema = z
  .object({
    activeStepIndex: z.number().int().min(0).default(0),
    maxStepIndex: z.number().int().min(0).max(3).default(0),
    ownerName: requiredText('Informe o nome do locador'),
    ownerCpf: cpfSchema,
    ownerEmail: z.string().email('Informe um e-mail válido'),
    ownerPhone: phoneSchema,
    tenantName: requiredText('Informe o nome do locatário'),
    tenantCpf: cpfSchema,
    tenantEmail: z.string().email('Informe um e-mail válido'),
    tenantPhone: phoneSchema,
    hasGuarantor: z.boolean().default(false),
    guarantorName: z.string().default(''),
    guarantorCpf: z.string().default(''),
    guarantorEmail: z.string().default(''),
    guarantorPhone: z.string().default(''),
    propertyId: requiredText('Selecione o imóvel'),
    propertyTitle: requiredText('Informe o imóvel'),
    propertyAddress: requiredText('Informe o endereço'),
    propertyZipCode: requiredText('Informe o CEP'),
    propertyCity: requiredText('Informe a cidade'),
    propertyState: z.string().length(2, 'Informe a UF'),
    propertyType: requiredText('Selecione o tipo do imóvel'),
    propertyRegistration: requiredText('Informe a matrícula'),
    propertyArea: requiredText('Informe a área'),
    contractType: requiredText('Selecione o tipo de contrato'),
    monthlyRent: requiredText('Informe o valor do aluguel'),
    condominiumFee: requiredText('Informe o condomínio'),
    iptu: requiredText('Informe o IPTU'),
    dueDay: requiredText('Informe o dia de vencimento'),
    startDate: requiredText('Informe a data de início'),
    endDate: requiredText('Informe a data de término'),
    guaranteeType: requiredText('Selecione a garantia'),
    adjustmentIndex: requiredText('Selecione o índice de reajuste'),
    notes: z.string().default(''),
  })
  .superRefine((values, context) => {
    // Triggered by either signal: the explicit "add guarantor" flag, or picking "Fiador" as the
    // guarantee type directly in the Conditions step — the two must stay consistent, otherwise a
    // contract can claim a guarantor exists ("Garantia: Fiador") with no guarantor data recorded.
    if (!values.hasGuarantor && values.guaranteeType !== 'Fiador') return

    addGuarantorTextIssue(
      context,
      'guarantorName',
      values.guarantorName,
      'Informe o nome do fiador',
    )
    addGuarantorCpfIssue(context, values.guarantorCpf)
    addGuarantorTextIssue(
      context,
      'guarantorEmail',
      values.guarantorEmail,
      'Informe o e-mail do fiador',
    )
    addGuarantorPhoneIssue(context, values.guarantorPhone)

    if (
      values.guarantorEmail.trim() &&
      !z.string().email().safeParse(values.guarantorEmail).success
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um e-mail válido',
        path: ['guarantorEmail'],
      })
    }
  })

export const createContractDefaultValues = {
  activeStepIndex: 0,
  maxStepIndex: 0,
  ownerName: 'Carlos Eduardo Mendes',
  ownerCpf: '529.982.247-25',
  ownerEmail: 'exemplo@email.com',
  ownerPhone: '(11) 99999-9999',
  tenantName: 'Bruno Oliveira',
  tenantCpf: '987.654.321-00',
  tenantEmail: 'exemplo@email.com',
  tenantPhone: '(11) 99999-9999',
  hasGuarantor: true,
  guarantorName: 'Fernanda Lima',
  guarantorCpf: '456.789.123-64',
  guarantorEmail: 'exemplo@email.com',
  guarantorPhone: '(11) 99999-9999',
  propertyId: 'apt-jardins-3q',
  propertyTitle: 'Apt Jardins 3q',
  propertyAddress: 'Alameda Lorena, 1420',
  propertyZipCode: '01424-001',
  propertyCity: 'São Paulo',
  propertyState: 'SP',
  propertyType: 'Apartamento',
  propertyRegistration: '123.456',
  propertyArea: '95 m²',
  contractType: 'Locação residencial',
  monthlyRent: 'R$ 6.500,00',
  condominiumFee: 'R$ 1.200,00',
  iptu: 'R$ 380,00',
  dueDay: '05',
  startDate: '01/09/2026',
  endDate: '31/08/2029',
  guaranteeType: 'Fiador',
  adjustmentIndex: 'IPCA',
  notes: 'Contrato com vistoria inicial anexada e reajuste anual.',
} satisfies z.infer<typeof createContractSchema>
