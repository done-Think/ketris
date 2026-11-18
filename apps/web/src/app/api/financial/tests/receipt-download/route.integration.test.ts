import { createHash, randomUUID } from 'node:crypto'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import {
  createLandlordScenario,
  createLandlordTenant,
  landlordRequest,
  linkLandlordAccount,
  removeLandlordTenants,
  routeContext,
} from '@server/shared/tests/fixtures/landlord-contract'
import { startPrivateS3Server } from '@server/shared/tests/fixtures/private-s3-server'

import { POST as registerPayment } from '../../charges/[id]/payment/route'
import { POST as reversePayment } from '../../charges/[id]/payment-reversal/route'
import { POST as initReceiptUpload } from '../../charges/[id]/receipt-uploads/route'
import { GET as downloadReceipt } from '../../charges/[id]/receipts/[receiptId]/download/route'
import { GET as getCharge } from '../../charges/[id]/route'
import { GET as listCharges } from '../../charges/route'

const tenantIds: string[] = []
const tokenService = new JoseTokenService()
const pdf = Buffer.from('%PDF-1.7\ncomprovante do aluguel\n%%EOF')

let storage: Awaited<ReturnType<typeof startPrivateS3Server>>
let scenario: Awaited<ReturnType<typeof createLandlordScenario>>
let receiptId: string
let otherContractId: string
const tokens = {} as Record<
  'manager' | 'agent' | 'renter' | 'propertyOwner' | 'landlord' | 'otherRenter' | 'otherTenant',
  string
>

async function signedUser(tenantId: string, role: 'OWNER' | 'RENTER' | 'PROPERTY_OWNER') {
  const user = await prisma.user.create({
    data: {
      tenantId,
      role,
      name: `Usuário ${role}`,
      email: `${randomUUID()}@receipt-download.test`,
      passwordHash: 'test',
    },
  })
  return { user, token: await tokenService.sign(user) }
}

const download = (token: string, id = receiptId) =>
  downloadReceipt(
    landlordRequest(`financial/charges/${scenario.charge.id}/receipts/${id}/download`, token),
    { params: Promise.resolve({ id: scenario.charge.id, receiptId: id }) },
  )

async function payWithReceipt(chargeId: string) {
  const init = await initReceiptUpload(
    landlordRequest(`financial/charges/${chargeId}/receipt-uploads`, tokens.manager, {
      name: 'pix-outubro.pdf',
      contentType: 'application/pdf',
      size: pdf.length,
      sha256: createHash('sha256').update(pdf).digest('hex'),
    }),
    routeContext(chargeId),
  )
  expect(init.status).toBe(201)
  const upload = await init.json()
  const put = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: upload.headers,
    body: new Uint8Array(pdf),
  })
  expect(put.status).toBe(200)

  const paid = await registerPayment(
    landlordRequest(`financial/charges/${chargeId}/payment`, tokens.manager, {
      paidAt: '2026-10-10',
      paymentMethod: 'PIX',
      receiptUploadToken: upload.uploadToken,
    }),
    routeContext(chargeId),
  )
  expect(paid.status).toBe(200)
  return (await paid.json()).charge.receipt.id as string
}

beforeAll(async () => {
  storage = await startPrivateS3Server()
  vi.stubEnv('AWS_REGION', 'us-east-1')
  vi.stubEnv('AWS_ACCESS_KEY_ID', 'financial-local-integration-only')
  vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'financial-local-integration-only')
  vi.stubEnv('AWS_IGNORE_CONFIGURED_ENDPOINT_URLS', 'false')
  vi.stubEnv('AWS_ENDPOINT_URL_S3', storage.url)
  vi.stubEnv('S3_BUCKET_NAME', 'financial-receipt-download-integration')

  scenario = await createLandlordScenario(tenantIds)
  const agencyId = scenario.agency.id
  tokens.manager = scenario.admin.token
  tokens.agent = scenario.agent.token
  tokens.landlord = scenario.landlord.token
  await linkLandlordAccount(scenario.party.id, scenario.landlord.id)

  const renter = await signedUser(agencyId, 'RENTER')
  tokens.renter = renter.token
  await prisma.contractParty.updateMany({
    where: { contractId: scenario.contract.id, role: 'RENTER' },
    data: { userId: renter.user.id },
  })

  const propertyOwner = await signedUser(agencyId, 'PROPERTY_OWNER')
  tokens.propertyOwner = propertyOwner.token
  await prisma.property.update({
    where: { id: scenario.property.id },
    data: { ownerId: propertyOwner.user.id },
  })

  const otherRenter = await signedUser(agencyId, 'RENTER')
  tokens.otherRenter = otherRenter.token
  const otherProperty = await prisma.property.create({
    data: {
      tenantId: agencyId,
      responsibleId: scenario.agent.id,
      title: 'Outro apartamento',
      purpose: 'RENT',
      type: 'APARTMENT',
      price: 2500,
      status: 'RENTED',
    },
  })
  const otherOpportunity = await prisma.opportunity.create({
    data: {
      tenantId: agencyId,
      propertyId: otherProperty.id,
      responsibleId: scenario.agent.id,
      interestedName: 'Outro locatário',
      interestedEmail: otherRenter.user.email,
      proposedValue: 2500,
      status: 'ACCEPTED',
    },
  })
  const otherContract = await prisma.contract.create({
    data: {
      tenantId: agencyId,
      propertyId: otherProperty.id,
      sourceOpportunityId: otherOpportunity.id,
      code: randomUUID(),
      amount: 2500,
      dueDay: 5,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      adjustmentIndex: 'IPCA',
      guaranteeType: 'DEPOSIT',
      status: 'ACTIVE',
      parties: {
        create: [
          {
            role: 'RENTER',
            name: 'Outro locatário',
            cpf: '33333333333',
            email: otherRenter.user.email,
            userId: otherRenter.user.id,
          },
        ],
      },
    },
  })

  otherContractId = otherContract.id

  const otherAgency = await createLandlordTenant(tenantIds, 'AGENCY', 'Outra imobiliária')
  tokens.otherTenant = (await signedUser(otherAgency.id, 'OWNER')).token

  receiptId = await payWithReceipt(scenario.charge.id)
})

afterAll(async () => {
  await removeLandlordTenants(tenantIds)
  await storage?.close()
  vi.unstubAllEnvs()
  await prisma.$disconnect()
})

describe('download do comprovante por papel (integração)', () => {
  it.each(['manager', 'renter', 'propertyOwner', 'landlord'] as const)(
    '%s, que vê a cobrança, baixa o comprovante vigente',
    async (who) => {
      const response = await download(tokens[who])

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('private, no-store')
      const { url, expiresAt } = await response.json()
      expect(typeof expiresAt).toBe('string')
      expect(Buffer.from(await (await fetch(url)).arrayBuffer())).toEqual(pdf)
    },
  )

  it.each(['renter', 'propertyOwner', 'landlord'] as const)(
    '%s recebe os dados do comprovante no detalhe e na listagem',
    async (who) => {
      const expected = {
        id: receiptId,
        name: 'pix-outubro.pdf',
        contentType: 'application/pdf',
        size: pdf.length,
        uploadedAt: expect.any(String),
      }

      const detail = await getCharge(
        landlordRequest(`financial/charges/${scenario.charge.id}`, tokens[who]),
        routeContext(scenario.charge.id),
      )
      expect(detail.status).toBe(200)
      expect((await detail.json()).charge.receipt).toEqual(expected)

      const list = await listCharges(landlordRequest('financial/charges', tokens[who]))
      expect((await list.json()).items).toEqual([
        expect.objectContaining({ id: scenario.charge.id, receipt: expected }),
      ])
    },
  )

  it.each(['otherRenter', 'otherTenant'] as const)(
    '%s, que não vê a cobrança, recebe o mesmo 404 de comprovante inexistente',
    async (who) => {
      const response = await download(tokens[who])
      const missing = await download(tokens.manager, randomUUID())

      expect(response.status).toBe(404)
      expect(missing.status).toBe(404)
      expect(await response.json()).toEqual(await missing.json())
    },
  )

  it('o corretor continua sem acesso ao financeiro (403)', async () => {
    const response = await download(tokens.agent)

    expect(response.status).toBe(403)
  })

  it('depois do estorno só a gestão da imobiliária baixa o comprovante antigo', async () => {
    const reversed = await reversePayment(
      landlordRequest(`financial/charges/${scenario.charge.id}/payment-reversal`, tokens.manager, {
        reason: 'Pix devolvido',
      }),
      routeContext(scenario.charge.id),
    )
    expect(reversed.status).toBe(200)

    expect((await download(tokens.manager)).status).toBe(200)
    for (const who of ['renter', 'propertyOwner', 'landlord'] as const) {
      expect((await download(tokens[who])).status).toBe(404)
    }
  })
})

describe('lista de cobranças filtrada por contrato (integração)', () => {
  const ids = async (who: keyof typeof tokens, contractId: string) => {
    const response = await listCharges(
      landlordRequest(`financial/charges?contractId=${contractId}`, tokens[who]),
    )
    expect(response.status).toBe(200)
    return ((await response.json()).items as Array<{ id: string; contractId: string }>).map(
      (item) => ({ id: item.id, contractId: item.contractId }),
    )
  }

  it('traz só as cobranças do contrato pedido', async () => {
    const items = await ids('manager', scenario.contract.id)
    expect(items.map((item) => item.id)).toContain(scenario.charge.id)
    expect(items.every((item) => item.contractId === scenario.contract.id)).toBe(true)
    expect(await ids('manager', otherContractId)).toEqual([])
  })

  it.each(['otherRenter', 'otherTenant'] as const)(
    'não abre cobranças de contrato alheio pelo filtro (%s)',
    async (who) => {
      expect(await ids(who, scenario.contract.id)).toEqual([])
    },
  )
})
