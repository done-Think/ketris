import { z } from 'zod'

const requiredText = (message: string) => z.string().min(1, message)

function addGuarantorIssue(context: z.RefinementCtx, path: string, value: string, message: string) {
  if (value.trim()) return

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message,
    path: [path],
  })
}

export const createContractSchema = z
  .object({
    activeStepIndex: z.number().int().min(0).default(0),
    maxStepIndex: z.number().int().min(0).max(3).default(0),
    ownerName: requiredText('Informe o nome do locador'),
    ownerCpf: requiredText('Informe o CPF do locador'),
    ownerEmail: z.string().email('Informe um e-mail válido'),
    ownerPhone: requiredText('Informe o telefone do locador'),
    tenantName: requiredText('Informe o nome do locatário'),
    tenantCpf: requiredText('Informe o CPF do locatário'),
    tenantEmail: z.string().email('Informe um e-mail válido'),
    tenantPhone: requiredText('Informe o telefone do locatário'),
    hasGuarantor: z.boolean().default(false),
    guarantorName: z.string().default(''),
    guarantorCpf: z.string().default(''),
    guarantorEmail: z.string().default(''),
    guarantorPhone: z.string().default(''),
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
    if (!values.hasGuarantor) return

    addGuarantorIssue(context, 'guarantorName', values.guarantorName, 'Informe o nome do fiador')
    addGuarantorIssue(context, 'guarantorCpf', values.guarantorCpf, 'Informe o CPF do fiador')
    addGuarantorIssue(
      context,
      'guarantorEmail',
      values.guarantorEmail,
      'Informe o e-mail do fiador',
    )
    addGuarantorIssue(
      context,
      'guarantorPhone',
      values.guarantorPhone,
      'Informe o telefone do fiador',
    )

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
  ownerCpf: '123.456.789-00',
  ownerEmail: 'exemplo@email.com',
  ownerPhone: '(11) 99999-9999',
  tenantName: 'Bruno Oliveira',
  tenantCpf: '000.000.000-00',
  tenantEmail: 'exemplo@email.com',
  tenantPhone: '(11) 99999-9999',
  hasGuarantor: false,
  guarantorName: '',
  guarantorCpf: '',
  guarantorEmail: '',
  guarantorPhone: '',
  propertyTitle: 'Apartamento moderno nos Jardins',
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
