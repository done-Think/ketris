import { expect, it } from 'vitest'
import {
  createContractRequestSchema,
  linkContractPartyUserRequestSchema,
  listContractsQuerySchema,
} from '../../schemas/contract-input.schema'
import {
  editContractRequestSchema,
  signContractPartyRequestSchema,
  transitionContractRequestSchema,
} from '../../schemas/contract-workflow.schema'
import {
  initContractDocumentRequestSchema,
  confirmContractDocumentRequestSchema,
} from '../../schemas/contract-document.schema'

const valid = {
  opportunityId: 'opportunity',
  type: 'RESIDENTIAL',
  amount: 2450.75,
  dueDay: 5,
  startDate: '2031-01-01',
  endDate: '2032-01-01',
  adjustmentIndex: 'IPCA',
  guaranteeType: 'DEPOSIT',
  notes: null,
  owner: {
    name: 'Proprietária',
    cpf: '52998224725',
    email: 'owner@example.test',
    phone: '11999999999',
  },
  tenant: {
    name: 'Locatário',
    cpf: '98765432100',
    email: 'tenant@example.test',
    phone: '11988888888',
  },
}

const validEdit = Object.fromEntries(
  Object.entries(valid).filter(([key]) => key !== 'opportunityId'),
)

it.each([
  { amount: 0 },
  { amount: 1.005 },
  { amount: 10000000000 },
  { dueDay: 1.5 },
  { dueDay: 0 },
  { dueDay: 32 },
  { startDate: '2031-02-31' },
  { startDate: '2031-02-31T00:00:00Z' },
  { startDate: '2031-13-01' },
  { endDate: '2030-01-01' },
  { startDate: '2031-02-29' },
  { owner: { ...valid.owner, phone: '' } },
  { owner: { ...valid.owner, phone: null } },
  { owner: { ...valid.owner, phone: undefined } },
  { owner: { ...valid.owner, phone: '123' } },
  { owner: { ...valid.owner, cpf: '11111111111' } },
  { notes: 'a'.repeat(10001) },
])('recusa criação e edição com entrada inválida: %o', (invalid) => {
  expect(createContractRequestSchema.safeParse({ ...valid, ...invalid }).success).toBe(false)
  expect(editContractRequestSchema.safeParse({ ...validEdit, ...invalid }).success).toBe(false)
})

it('preserva centavos, limite máximo e datas válidas inclusive em ano bissexto', () => {
  const result = createContractRequestSchema.parse({
    ...valid,
    amount: 9999999999.99,
    startDate: '2028-02-29',
    endDate: '2029-01-01T00:00:00Z',
  })
  expect(result.amount).toBe(9999999999.99)
  expect(result.startDate.toISOString()).toBe('2028-02-29T00:00:00.000Z')
})

it.each([
  [createContractRequestSchema, valid],
  [editContractRequestSchema, validEdit],
  [linkContractPartyUserRequestSchema, { email: 'tenant@example.test' }],
  [signContractPartyRequestSchema, { documentId: 'document' }],
  [transitionContractRequestSchema, { reason: 'Fim do contrato' }],
  [listContractsQuerySchema, { page: 1 }],
  [initContractDocumentRequestSchema, { name: 'final.pdf', size: 512, sha256: 'd'.repeat(64) }],
  [confirmContractDocumentRequestSchema, { uploadToken: 'token' }],
] as const)('recusa campos desconhecidos sem descartá-los silenciosamente', (schema, input) => {
  expect(schema.safeParse({ ...input, unsupported: 'Não descartar' }).success).toBe(false)
})

it('recusa campos desconhecidos dentro das partes e não permite trocar origem ou imóvel na edição', () => {
  expect(
    createContractRequestSchema.safeParse({
      ...valid,
      owner: { ...valid.owner, unsupported: true },
    }).success,
  ).toBe(false)
  expect(
    editContractRequestSchema.safeParse({ ...validEdit, opportunityId: 'other' }).success,
  ).toBe(false)
  expect(editContractRequestSchema.safeParse({ ...validEdit, propertyId: 'other' }).success).toBe(
    false,
  )
})
