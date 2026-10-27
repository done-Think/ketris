import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import { contractPeriodDates } from '@server/contracts/infrastructure/contract-period'
import {
  contractRequest,
  createContractWorkflowFixture,
  cleanupContractWorkflowFixture,
} from '@server/contracts/tests/fixtures/workflow-database'
import { GET } from '../../route'
import { POST as link } from '../../[id]/parties/[partyId]/link-user/route'
import type { ContractsResponseDTO } from '@server/contracts/types/dto'
import pt from '@/i18n/messages/pt-BR/contracts.json'
import en from '@/i18n/messages/en-US/contracts.json'
import es from '@/i18n/messages/es-ES/contracts.json'

let fixture: Awaited<ReturnType<typeof createContractWorkflowFixture>>
const prefix = 'list-' + randomUUID()
const dates = contractPeriodDates()
beforeAll(async () => {
  fixture = await createContractWorkflowFixture()
  const responsavelId = await propertyResponsibleId(prisma, fixture.propertyId)
  await prisma.oportunidade.createMany({
    data: Array.from({ length: 103 }, (_, index) => ({
      id: prefix + '-opp-' + index,
      tenantId: fixture.tenantId,
      imovelId: fixture.propertyId,
      responsavelId,
      interessadoNome: 'Pessoa ' + index,
      interessadoEmail: 'person' + index + '@example.test',
      valorProposto: 2000,
      status: 'ACEITA',
    })),
  })
  const statuses = [
    'RASCUNHO',
    'EM_REVISAO',
    'AGUARDANDO_ASSINATURA',
    'ASSINADO',
    'ATIVO',
    'ENCERRADO',
    'CANCELADO',
  ] as const
  await prisma.contrato.createMany({
    data: Array.from({ length: 103 }, (_, index) => ({
      id: prefix + '-contract-' + index,
      tenantId: fixture.tenantId,
      imovelId: fixture.propertyId,
      oportunidadeOrigemId: prefix + '-opp-' + index,
      codigo: 'LST-' + String(index).padStart(3, '0'),
      tipo: 'RESIDENCIAL',
      valor: 1000 + index + 0.25,
      diaVencimento: 5,
      dataInicio: new Date('2020-01-01'),
      dataFim:
        index < 2
          ? new Date(dates.today.getTime() + (index === 0 ? 15 : 45) * 86400000)
          : new Date('2021-01-01'),
      indiceReajuste: 'IPCA',
      tipoGarantia: 'CAUCAO',
      status: statuses[index % statuses.length],
    })),
  })
})
afterAll(async () => {
  if (fixture) await cleanupContractWorkflowFixture(fixture.tenantId)
})

async function list(query: string, token = fixture.ownerToken): Promise<ContractsResponseDTO> {
  const response = await GET(contractRequest(token, query))
  expect(response.status).toBe(200)
  return response.json()
}

it('pagina além dos primeiros 100, ordena no servidor e mantém as contagens completas', async () => {
  const first = await list('?page=1&pageSize=100&sortBy=amount&sortOrder=asc')
  const second = await list('?page=2&pageSize=100&sortBy=amount&sortOrder=asc')
  expect(first.items).toHaveLength(100)
  expect(second.items).toHaveLength(4)
  expect(first.totalCount).toBe(104)
  expect(second.summary.total).toBe(104)
  const combined = [...first.items, ...second.items]
  expect(new Set(combined.map((item) => item.id)).size).toBe(104)
  expect(combined.map((item) => item.amount)).toEqual(
    combined.map((item) => item.amount).sort((a, b) => a - b),
  )
  const found = await list('?search=LST-102&pageSize=5')
  expect(found.totalCount).toBe(1)
  expect(found.items[0].code).toBe('LST-102')
  expect(found.summary.total).toBe(104)
})

it('separa o indicador de 30 dias da aba de 90 dias', async () => {
  const result = await list('?period=NEXT_90_DAYS')
  expect(result.summary.expiring30).toBe(1)
  expect(result.summary.expiring90).toBe(2)
  expect(result.totalCount).toBe(2)
  expect(result.items.map((item) => item.code).sort()).toEqual(['LST-000', 'LST-001'])
})

it.each([
  ['pt-BR', pt],
  ['en-US', en],
  ['es-ES', es],
] as const)('ordena status pelo texto de %s sobre todas as páginas', async (locale, dictionary) => {
  const labels = {
    RASCUNHO: 'draft',
    EM_REVISAO: 'review',
    AGUARDANDO_ASSINATURA: 'awaitingSignature',
    ASSINADO: 'signed',
    ATIVO: 'active',
    ENCERRADO: 'closed',
    CANCELADO: 'cancelled',
  } as const
  const first = await list('?sortBy=status&sortOrder=asc&locale=' + locale + '&pageSize=100')
  const second = await list(
    '?sortBy=status&sortOrder=asc&locale=' + locale + '&pageSize=100&page=2',
  )
  const result = [...first.items, ...second.items].map(
    (item) => dictionary.status[labels[item.status]],
  )
  expect(result).toEqual([...result].sort(new Intl.Collator(locale).compare))
})

it('restringe também as contagens do corretor e do locatário ao escopo autorizado', async () => {
  const agent = await list('?search=LST', fixture.agentToken)
  expect(agent.items).toEqual([])
  expect(agent.totalCount).toBe(0)
  expect(agent.summary).toEqual({ total: 0, active: 0, expiring30: 0, expiring90: 0, closed: 0 })
  const before = await list('', fixture.renterToken)
  expect(before.summary.total).toBe(0)
  expect(
    (
      await link(
        contractRequest(fixture.ownerToken, '/link', 'POST', {
          email: fixture.editBody.tenant.email,
        }),
        { params: Promise.resolve({ id: fixture.contractId, partyId: fixture.tenantPartyId }) },
      )
    ).status,
  ).toBe(200)
  const linked = await list('?pageSize=5', fixture.renterToken)
  expect(linked.totalCount).toBe(1)
  expect(linked.summary.total).toBe(1)
  expect(linked.items.map((item) => item.id)).toEqual([fixture.contractId])
})
