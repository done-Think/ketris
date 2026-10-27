import { createHash, randomUUID } from 'node:crypto'

import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { JoseTokenService } from '@server/auth/infrastructure/jose-token.service'
import { prisma } from '@server/db/prisma'
import { startPrivateS3Server } from '@server/shared/tests/fixtures/private-s3-server'

import { POST as cancelCharge } from '../../charges/[id]/cancel/route'
import { GET as getHistory } from '../../charges/[id]/history/route'
import { POST as registerPayment } from '../../charges/[id]/payment/route'
import { POST as reversePayment } from '../../charges/[id]/payment-reversal/route'
import { POST as initReceiptUpload } from '../../charges/[id]/receipt-uploads/route'
import { GET as downloadReceipt } from '../../charges/[id]/receipts/[receiptId]/download/route'
import { DELETE as deleteCharge, GET as getCharge, PATCH } from '../../charges/[id]/route'
import { GET as exportCharges } from '../../charges/export/route'
import { GET as listCharges, POST as createCharge } from '../../charges/route'
import { GET as getSummary } from '../../summary/route'
import { propertyResponsibleId } from '@server/shared/tests/fixtures/property-responsible'

type Papel = 'OWNER' | 'RENTER' | 'PROPERTY_OWNER'

const tokenService = new JoseTokenService()
const pdf = Buffer.from('%PDF-1.7\ncomprovante de pagamento\n%%EOF')
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01])

let storage: Awaited<ReturnType<typeof startPrivateS3Server>>
const tenantIds: string[] = []
let tenantId: string
let contractId: string
const tokens = {} as Record<'owner' | 'renter' | 'propertyOwner' | 'otherOwner', string>

async function user(tenant: string, papel: Papel) {
  const created = await prisma.usuario.create({
    data: {
      tenantId: tenant,
      nome: `Usuário ${papel}`,
      email: `financial-${papel.toLowerCase()}-${randomUUID()}@ketris.dev`,
      senhaHash: 'hash-fake',
      papel,
    },
  })
  const token = await tokenService.sign({
    id: created.id,
    tenantId: created.tenantId,
    nome: created.nome,
    email: created.email,
    papel: created.papel,
    ativo: created.ativo,
    vinculoAprovadoEm: created.vinculoAprovadoEm,
  })
  return { user: created, token }
}

function request(token: string, path: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost/api/financial/${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })

async function newCharge(body: Record<string, unknown> = {}) {
  const response = await createCharge(
    request(tokens.owner, 'charges', 'POST', {
      contractId,
      type: 'A_RECEBER',
      amount: 1500,
      dueDate: '2099-11-05',
      status: 'PENDENTE',
      ...body,
    }),
  )
  expect(response.status).toBe(201)
  return (await response.json()).charge as { id: string; code: string; status: string }
}

async function uploadReceipt(chargeId: string, bytes: Buffer, contentType: string, name: string) {
  const response = await initReceiptUpload(
    request(tokens.owner, `charges/${chargeId}/receipt-uploads`, 'POST', {
      name,
      contentType,
      size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    }),
    params(chargeId),
  )
  expect(response.status).toBe(201)
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  const upload = await response.json()
  const put = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: upload.headers,
    body: new Uint8Array(bytes),
  })
  expect(put.status).toBe(200)
  return upload.uploadToken as string
}

beforeAll(async () => {
  storage = await startPrivateS3Server()
  vi.stubEnv('AWS_REGION', 'us-east-1')
  vi.stubEnv('AWS_ACCESS_KEY_ID', 'financial-local-integration-only')
  vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'financial-local-integration-only')
  vi.stubEnv('AWS_IGNORE_CONFIGURED_ENDPOINT_URLS', 'false')
  vi.stubEnv('AWS_ENDPOINT_URL_S3', storage.url)
  vi.stubEnv('S3_BUCKET_NAME', 'financial-private-integration')

  const tenant = await prisma.tenant.create({
    data: { nome: 'Tenant Ciclo Financeiro', slug: `financial-cycle-${randomUUID()}` },
  })
  const other = await prisma.tenant.create({
    data: { nome: 'Outro Tenant', slug: `financial-other-${randomUUID()}` },
  })
  tenantId = tenant.id
  tenantIds.push(tenant.id, other.id)

  const owner = await user(tenantId, 'OWNER')
  const renter = await user(tenantId, 'RENTER')
  const propertyOwner = await user(tenantId, 'PROPERTY_OWNER')
  tokens.owner = owner.token
  tokens.renter = renter.token
  tokens.propertyOwner = propertyOwner.token
  tokens.otherOwner = (await user(other.id, 'OWNER')).token

  const property = await prisma.imovel.create({
    data: {
      tenantId,
      responsavelId: owner.user.id,
      proprietarioId: propertyOwner.user.id,
      titulo: 'Casa do ciclo',
      finalidade: 'ALUGUEL',
      tipo: 'CASA',
      valor: 1500,
      status: 'RENTED',
    },
  })
  const opportunity = await prisma.oportunidade.create({
    data: {
      tenantId,
      imovelId: property.id,
      responsavelId: await propertyResponsibleId(prisma, property.id),
      interessadoNome: 'Locatário',
      interessadoEmail: 'locatario@example.com',
      valorProposto: 1500,
      status: 'ACEITA',
    },
  })
  const contract = await prisma.contrato.create({
    data: {
      tenantId,
      imovelId: property.id,
      oportunidadeOrigemId: opportunity.id,
      codigo: `CTR-${randomUUID()}`,
      tipo: 'RESIDENCIAL',
      valor: 1500,
      diaVencimento: 5,
      dataInicio: new Date('2026-10-01'),
      dataFim: new Date('2027-10-01'),
      indiceReajuste: 'IGPM',
      tipoGarantia: 'CAUCAO',
      status: 'ATIVO',
      partes: {
        create: [
          {
            papel: 'LOCATARIO',
            nome: 'Locatário',
            cpf: '22222222222',
            email: 'locatario@example.com',
            usuarioId: renter.user.id,
          },
        ],
      },
    },
  })
  contractId = contract.id
})

afterAll(async () => {
  await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } })
  await storage?.close()
  vi.unstubAllEnvs()
  await prisma.$disconnect()
})

describe('ciclo de vida da cobrança (integração)', () => {
  it('paga com comprovante, o locatário e o proprietário baixam, e estornar tira do card', async () => {
    const charge = await newCharge()
    const uploadToken = await uploadReceipt(charge.id, pdf, 'application/pdf', 'pix.pdf')

    const paid = await registerPayment(
      request(tokens.owner, `charges/${charge.id}/payment`, 'POST', {
        paidAt: '2026-10-20',
        paymentMethod: 'PIX',
        receiptUploadToken: uploadToken,
      }),
      params(charge.id),
    )
    expect(paid.status).toBe(200)
    const paidCharge = (await paid.json()).charge
    expect(paidCharge).toMatchObject({
      status: 'PAGA',
      receipt: { name: 'pix.pdf', contentType: 'application/pdf', size: pdf.length },
    })
    const receiptId = paidCharge.receipt.id as string

    for (const token of [tokens.owner, tokens.renter, tokens.propertyOwner]) {
      const response = await downloadReceipt(
        request(token, `charges/${charge.id}/receipts/${receiptId}/download`),
        { params: Promise.resolve({ id: charge.id, receiptId }) },
      )
      expect(response.status).toBe(200)
      const { url } = await response.json()
      expect(Buffer.from(await (await fetch(url)).arrayBuffer())).toEqual(pdf)
    }
    const foreign = await downloadReceipt(
      request(tokens.otherOwner, `charges/${charge.id}/receipts/${receiptId}/download`),
      { params: Promise.resolve({ id: charge.id, receiptId }) },
    )
    expect(foreign.status).toBe(404)

    const reversed = await reversePayment(
      request(tokens.owner, `charges/${charge.id}/payment-reversal`, 'POST', {
        reason: 'Pix devolvido pelo banco',
      }),
      params(charge.id),
    )
    expect(reversed.status).toBe(200)
    expect((await reversed.json()).charge).toMatchObject({
      status: 'PENDENTE',
      paidAt: null,
      paymentMethod: null,
      receipt: null,
    })

    const renterAfter = await downloadReceipt(
      request(tokens.renter, `charges/${charge.id}/receipts/${receiptId}/download`),
      { params: Promise.resolve({ id: charge.id, receiptId }) },
    )
    expect(renterAfter.status).toBe(404)
    const ownerAfter = await downloadReceipt(
      request(tokens.owner, `charges/${charge.id}/receipts/${receiptId}/download`),
      { params: Promise.resolve({ id: charge.id, receiptId }) },
    )
    expect(ownerAfter.status).toBe(200)

    const history = await getHistory(
      request(tokens.owner, `charges/${charge.id}/history`),
      params(charge.id),
    )
    const { events } = await history.json()
    expect(events.map((event: { action: string }) => event.action)).toEqual([
      'PAYMENT_REVERSED',
      'PAYMENT_REGISTERED',
      'CREATED',
    ])
    expect(events[0]).toMatchObject({
      reason: 'Pix devolvido pelo banco',
      fromStatus: 'PAGA',
      toStatus: 'PENDENTE',
      receipt: { id: receiptId },
      actorName: 'Usuário OWNER',
    })

    for (const token of [tokens.renter, tokens.propertyOwner]) {
      expect(
        (await getHistory(request(token, `charges/${charge.id}/history`), params(charge.id)))
          .status,
      ).toBe(403)
    }

    const deleted = await deleteCharge(
      request(tokens.owner, `charges/${charge.id}`, 'DELETE'),
      params(charge.id),
    )
    expect(deleted.status).toBe(409)
  })

  it('recusa comprovante cujo conteúdo não bate com o tipo declarado', async () => {
    const charge = await newCharge()
    const uploadToken = await uploadReceipt(charge.id, png, 'application/pdf', 'falso.pdf')

    const response = await registerPayment(
      request(tokens.owner, `charges/${charge.id}/payment`, 'POST', {
        paidAt: '2026-10-20',
        paymentMethod: 'PIX',
        receiptUploadToken: uploadToken,
      }),
      params(charge.id),
    )

    expect(response.status).toBe(422)
    expect((await response.json()).error.code).toBe('CHARGE_RECEIPT_INVALID')
    expect(await prisma.cobranca.findUniqueOrThrow({ where: { id: charge.id } })).toMatchObject({
      status: 'PENDENTE',
      comprovanteAtualId: null,
    })
  })

  it('aceita PNG como comprovante', async () => {
    const charge = await newCharge()
    const uploadToken = await uploadReceipt(charge.id, png, 'image/png', 'print.png')

    const response = await registerPayment(
      request(tokens.owner, `charges/${charge.id}/payment`, 'POST', {
        paidAt: '2026-10-20',
        paymentMethod: 'Transferência',
        receiptUploadToken: uploadToken,
      }),
      params(charge.id),
    )

    expect(response.status).toBe(200)
    expect((await response.json()).charge.receipt).toMatchObject({ contentType: 'image/png' })
  })

  it('cancela com motivo obrigatório e não reabre', async () => {
    const charge = await newCharge({ status: 'AGENDADA' })

    const withoutReason = await cancelCharge(
      request(tokens.owner, `charges/${charge.id}/cancel`, 'POST', { reason: '' }),
      params(charge.id),
    )
    expect(withoutReason.status).toBe(400)

    const cancelled = await cancelCharge(
      request(tokens.owner, `charges/${charge.id}/cancel`, 'POST', {
        reason: 'Contrato renegociado',
      }),
      params(charge.id),
    )
    expect(cancelled.status).toBe(200)
    expect((await cancelled.json()).charge).toMatchObject({
      status: 'CANCELADA',
      cancellationReason: 'Contrato renegociado',
    })

    const again = await cancelCharge(
      request(tokens.owner, `charges/${charge.id}/cancel`, 'POST', { reason: 'De novo' }),
      params(charge.id),
    )
    expect(again.status).toBe(409)
    const pay = await registerPayment(
      request(tokens.owner, `charges/${charge.id}/payment`, 'POST', {
        paidAt: '2026-10-20',
        paymentMethod: 'PIX',
      }),
      params(charge.id),
    )
    expect(pay.status).toBe(409)
    const locked = await PATCH(
      request(tokens.owner, `charges/${charge.id}`, 'PATCH', { dueDate: '2099-12-01' }),
      params(charge.id),
    )
    expect(locked.status).toBe(409)
  })

  it('marca como atrasada pela data, no filtro e nos KPIs', async () => {
    const late = await newCharge({ dueDate: '2020-01-05', amount: 700 })
    await newCharge({ dueDate: '2020-01-06', amount: 300, status: 'AGENDADA' })

    const detail = await getCharge(request(tokens.owner, `charges/${late.id}`), params(late.id))
    expect((await detail.json()).charge.status).toBe('ATRASADA')

    const overdue = await (
      await listCharges(request(tokens.owner, 'charges?status=ATRASADA'))
    ).json()
    expect(overdue.items.map((item: { status: string }) => item.status)).toEqual([
      'ATRASADA',
      'ATRASADA',
    ])
    const pending = await (
      await listCharges(request(tokens.owner, 'charges?status=PENDENTE&pageSize=100'))
    ).json()
    expect(pending.items.map((item: { id: string }) => item.id)).not.toContain(late.id)

    const summary = await (await getSummary(request(tokens.owner, 'summary'))).json()
    expect(summary.overdueTotal).toBe(1000)
  })

  it('o banco recusa apagar um contrato que tenha cobranças', async () => {
    await expect(prisma.contrato.delete({ where: { id: contractId } })).rejects.toThrow()
  })

  it('numera as cobranças por tenant', async () => {
    const own = await newCharge()
    const response = await createCharge(
      request(tokens.otherOwner, 'charges', 'POST', {
        description: 'Primeira do outro tenant',
        type: 'A_PAGAR',
        amount: 10,
        dueDate: '2099-01-01',
        status: 'PENDENTE',
      }),
    )
    const foreign = (await response.json()).charge

    expect(foreign.code).toBe(`COB-${new Date().getFullYear()}-0001`)
    expect(own.code).not.toBe(foreign.code)
  })

  it('filtra por mês de vencimento, conta por status e exporta o mês em CSV', async () => {
    await newCharge({ dueDate: '2091-03-10', amount: 100 })
    await newCharge({ dueDate: '2091-03-20', amount: 200.5, status: 'AGENDADA' })
    const april = await newCharge({ dueDate: '2091-04-01', amount: 999 })

    const list = await (
      await listCharges(request(tokens.owner, 'charges?dueMonth=2091-03&status=AGENDADA'))
    ).json()
    expect(list.totalCount).toBe(1)
    expect(list.statusCounts).toMatchObject({ ALL: 2, PENDENTE: 1, AGENDADA: 1, ATRASADA: 0 })

    const summary = await (await getSummary(request(tokens.owner, 'summary?month=2091-03'))).json()
    expect(summary.monthlyReceivable).toBe(300.5)
    expect(summary.monthlySeries.at(-1)).toEqual({ year: 2091, month: 3, total: 300.5 })
    expect(summary.monthlySeries[0]).toMatchObject({ year: 2090, month: 10 })

    const response = await exportCharges(
      request(tokens.owner, 'charges/export?month=2091-03&locale=es-ES'),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="cobrancas-2091-03.csv"',
    )
    const csv = await response.text()
    const lines = csv.replace('\uFEFF', '').trim().split('\r\n')
    expect(lines[0]).toContain('Código;Descripción')
    expect(lines).toHaveLength(3)
    expect(lines[2]).toContain(';A cobrar;20/03/2091;200,50;Programada;;')
    expect(csv).not.toContain(april.code)

    for (const token of [tokens.renter, tokens.propertyOwner]) {
      expect((await exportCharges(request(token, 'charges/export?month=2091-03'))).status).toBe(403)
    }
    expect(
      (await exportCharges(request(tokens.owner, 'charges/export?month=2091-13'))).status,
    ).toBe(400)
  })
})
