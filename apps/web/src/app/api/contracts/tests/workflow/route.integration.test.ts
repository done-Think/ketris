import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { prisma } from '@server/db/prisma'
import {
  contractRequest,
  createContractWorkflowFixture,
  createVerifiedContractProof,
  cleanupContractWorkflowFixture,
} from '@server/contracts/tests/fixtures/workflow-database'
import { PATCH, GET as getContract } from '../../[id]/route'
import { POST as sign } from '../../[id]/parties/[partyId]/sign/route'
import { POST as cancel } from '../../[id]/cancel/route'
import { POST as close } from '../../[id]/close/route'
import { GET as history } from '../../[id]/history/route'
import { POST as link } from '../../[id]/parties/[partyId]/link-user/route'

let fixture: Awaited<ReturnType<typeof createContractWorkflowFixture>>
beforeEach(async () => {
  vi.stubEnv('VERCEL', '0')
  fixture = await createContractWorkflowFixture()
})
afterEach(async () => {
  vi.unstubAllEnvs()
  if (fixture) await cleanupContractWorkflowFixture(fixture.tenantId)
})
function context() {
  return { params: Promise.resolve({ id: fixture.contractId }) }
}
function partyContext(partyId: string) {
  return { params: Promise.resolve({ id: fixture.contractId, partyId }) }
}
async function signAll() {
  const proof = await createVerifiedContractProof(fixture.contractId, fixture.actorId)
  for (const partyId of [fixture.ownerPartyId, fixture.tenantPartyId]) {
    const response = await sign(
      contractRequest(
        fixture.ownerToken,
        '/' + fixture.contractId + '/parties/' + partyId + '/sign',
        'POST',
        { documentId: proof.id },
      ),
      partyContext(partyId),
    )
    expect(response.status).toBe(200)
  }
  return proof
}

it('preserva centavos, protege os CPFs e registra a autoria da criação', async () => {
  const row = await prisma.contrato.findUniqueOrThrow({
    where: { id: fixture.contractId },
    include: { partes: true },
  })
  expect(row.valor.toNumber()).toBe(1750.75)
  expect(row.criadoPorId).toBe(fixture.actorId)
  expect(row.partes.every((party) => party.cpf.startsWith('enc:v1:'))).toBe(true)
  const response = await getContract(
    contractRequest(fixture.ownerToken, '/' + fixture.contractId),
    context(),
  )
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(
    body.contract.parties.find((party: { role: string }) => party.role === 'LOCADOR').cpf,
  ).toBe('52998224725')
  const records = await prisma.contractAuditEvent.findMany({
    where: { contractId: fixture.contractId },
  })
  expect(records).toHaveLength(1)
  expect(records[0]).toMatchObject({ action: 'CREATED', actorUserId: fixture.actorId })
})

it('edita antes da primeira assinatura, preserva partes mantidas e exige PDF da nova revisão', async () => {
  const oldProof = await createVerifiedContractProof(fixture.contractId, fixture.actorId)
  const before = await prisma.parteContrato.findMany({
    where: { contratoId: fixture.contractId },
    orderBy: { id: 'asc' },
  })
  const response = await PATCH(
    contractRequest(fixture.ownerToken, '/' + fixture.contractId, 'PATCH', {
      ...fixture.editBody,
      amount: 1800.25,
      notes: 'Observação atualizada',
    }),
    context(),
  )
  expect(response.status).toBe(200)
  const result = await response.json()
  expect(result.contract.amount).toBe(1800.25)
  expect(result.contract.dataRevision).toBe(1)
  expect(
    await prisma.parteContrato.findMany({
      where: { contratoId: fixture.contractId },
      orderBy: { id: 'asc' },
    }),
  ).toEqual(before)
  const stale = await sign(
    contractRequest(fixture.ownerToken, '/' + fixture.contractId + '/parties/x/sign', 'POST', {
      documentId: oldProof.id,
    }),
    partyContext(fixture.ownerPartyId),
  )
  expect(stale.status).toBe(409)
  expect((await stale.json()).error.code).toBe('CONTRACT_DOCUMENT_OUTDATED')
  const proof = await createVerifiedContractProof(fixture.contractId, fixture.actorId)
  const signed = await sign(
    contractRequest(fixture.ownerToken, '/' + fixture.contractId + '/parties/x/sign', 'POST', {
      documentId: proof.id,
    }),
    partyContext(fixture.ownerPartyId),
  )
  expect(signed.status).toBe(200)
  expect(await prisma.documentoContrato.count({ where: { contratoId: fixture.contractId } })).toBe(
    2,
  )
  expect(
    (
      await PATCH(
        contractRequest(fixture.ownerToken, '/' + fixture.contractId, 'PATCH', {
          ...fixture.editBody,
          amount: 1900,
        }),
        context(),
      )
    ).status,
  ).toBe(409)
})

it('não invalida o documento ao salvar sem mudanças e revoga o vínculo quando troca o e-mail', async () => {
  expect(
    (
      await link(
        contractRequest(fixture.ownerToken, '/link', 'POST', {
          email: fixture.editBody.tenant.email,
        }),
        partyContext(fixture.tenantPartyId),
      )
    ).status,
  ).toBe(200)
  const noChange = await PATCH(
    contractRequest(fixture.ownerToken, '/' + fixture.contractId, 'PATCH', fixture.editBody),
    context(),
  )
  expect(noChange.status).toBe(200)
  expect((await noChange.json()).contract.dataRevision).toBe(0)
  const edited = await PATCH(
    contractRequest(fixture.ownerToken, '/' + fixture.contractId, 'PATCH', {
      ...fixture.editBody,
      tenant: { ...fixture.editBody.tenant, email: 'new-person@example.test' },
    }),
    context(),
  )
  expect(edited.status).toBe(200)
  expect(
    (await prisma.parteContrato.findUniqueOrThrow({ where: { id: fixture.tenantPartyId } }))
      .usuarioId,
  ).toBeNull()
  expect(
    (await getContract(contractRequest(fixture.renterToken, '/' + fixture.contractId), context()))
      .status,
  ).toBe(404)
})

it('exige motivo, cancela sem apagar cobranças e impede reativação por registro manual', async () => {
  expect(
    (await cancel(contractRequest(fixture.ownerToken, '/cancel', 'POST', {}), context())).status,
  ).toBe(400)
  const charge = await prisma.cobranca.create({
    data: {
      tenantId: fixture.tenantId,
      contratoId: fixture.contractId,
      codigo: 'WORKFLOW-' + randomUUID(),
      tipo: 'A_RECEBER',
      valor: 500,
      vencimento: new Date('2031-01-01'),
      status: 'PENDENTE',
    },
  })
  const response = await cancel(
    contractRequest(fixture.ownerToken, '/cancel', 'POST', { reason: 'Negociação cancelada' }),
    context(),
  )
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.contract).toMatchObject({
    status: 'CANCELADO',
    cancellationReason: 'Negociação cancelada',
    cancelledBy: { id: fixture.actorId },
  })
  expect(body.contract.cancelledAt).toEqual(expect.any(String))
  expect(await prisma.cobranca.findUnique({ where: { id: charge.id } })).toEqual(charge)
  const proof = await createVerifiedContractProof(fixture.contractId, fixture.actorId)
  expect(
    (
      await sign(
        contractRequest(fixture.ownerToken, '/sign', 'POST', { documentId: proof.id }),
        partyContext(fixture.ownerPartyId),
      )
    ).status,
  ).toBe(409)
})

it('registra a assinatura como manual com evidência, ativa ao final e encerra sem apagar o financeiro', async () => {
  const proof = await signAll()
  const signatures = await prisma.assinatura.findMany({
    where: { parteContrato: { contratoId: fixture.contractId } },
  })
  expect(
    signatures.every(
      (signature) =>
        signature.metodo === 'MANUAL' &&
        signature.documentoId === proof.id &&
        signature.sha256Documento === proof.sha256 &&
        signature.ipRegistro === null &&
        signature.userAgentRegistro === 'Contracts integration',
    ),
  ).toBe(true)
  const charges = await prisma.cobranca.findMany({ where: { contratoId: fixture.contractId } })
  expect(charges).toHaveLength(1)
  expect(charges[0].valor.toNumber()).toBe(1750.75)
  const response = await close(
    contractRequest(fixture.ownerToken, '/close', 'POST', { reason: 'Locação encerrada' }),
    context(),
  )
  expect(response.status).toBe(200)
  expect((await response.json()).contract.status).toBe('ENCERRADO')
  const property = await prisma.imovel.findUniqueOrThrow({ where: { id: fixture.propertyId } })
  expect(property.status).toBe('INACTIVE')
  expect(property.publicadoEm).toEqual(new Date('2020-01-01'))
  expect(await prisma.cobranca.findMany({ where: { contratoId: fixture.contractId } })).toEqual(
    charges,
  )
  const audits = await prisma.contractAuditEvent.findMany({
    where: { contractId: fixture.contractId },
  })
  expect(audits.map((audit) => audit.action)).toEqual(
    expect.arrayContaining(['CREATED', 'MANUAL_SIGNATURE_REGISTERED', 'CLOSED']),
  )
})

it('preserva Vendido ao encerrar contratos de venda', async () => {
  await prisma.imovel.update({ where: { id: fixture.propertyId }, data: { finalidade: 'VENDA' } })
  await signAll()
  expect(
    (
      await close(
        contractRequest(fixture.ownerToken, '/close', 'POST', { reason: 'Venda concluída' }),
        context(),
      )
    ).status,
  ).toBe(200)
  expect(
    (await prisma.imovel.findUniqueOrThrow({ where: { id: fixture.propertyId } })).status,
  ).toBe('SOLD')
})

it('aplica as permissões atuais em edição e histórico sem expor evidências técnicas', async () => {
  expect(
    (
      await PATCH(
        contractRequest(fixture.agentToken, '/edit', 'PATCH', fixture.editBody),
        context(),
      )
    ).status,
  ).toBe(404)
  expect(
    (
      await PATCH(
        contractRequest(fixture.renterToken, '/edit', 'PATCH', fixture.editBody),
        context(),
      )
    ).status,
  ).toBe(403)
  expect((await history(contractRequest(fixture.agentToken, '/history'), context())).status).toBe(
    404,
  )
  const response = await history(
    contractRequest(fixture.ownerToken, '/history?page=1&pageSize=1'),
    context(),
  )
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.items).toHaveLength(1)
  expect(body.items[0].actor).toMatchObject({ id: fixture.actorId, name: 'Gestora' })
  expect(JSON.stringify(body)).not.toContain('52998224725')
  expect(JSON.stringify(body)).not.toContain('98765432100')
  expect(JSON.stringify(body)).not.toContain('ipRegistro')
  expect(JSON.stringify(body)).not.toContain('objectKey')
  expect((await history(contractRequest(fixture.renterToken, '/history'), context())).status).toBe(
    404,
  )
})

it('recusa registro manual sem PDF ou por locatário e guarda somente o IP confiável', async () => {
  expect(
    (
      await sign(
        contractRequest(fixture.ownerToken, '/sign', 'POST', {}),
        partyContext(fixture.ownerPartyId),
      )
    ).status,
  ).toBe(400)
  expect(
    (
      await sign(
        contractRequest(fixture.ownerToken, '/sign', 'POST', { documentId: 'missing' }),
        partyContext(fixture.ownerPartyId),
      )
    ).status,
  ).toBe(404)
  const proof = await createVerifiedContractProof(fixture.contractId, fixture.actorId)
  expect(
    (
      await sign(
        contractRequest(fixture.renterToken, '/sign', 'POST', { documentId: proof.id }),
        partyContext(fixture.ownerPartyId),
      )
    ).status,
  ).toBe(403)
  vi.stubEnv('VERCEL', '1')
  const request = contractRequest(fixture.ownerToken, '/sign', 'POST', { documentId: proof.id })
  request.headers.set('x-vercel-forwarded-for', '203.0.113.27')
  expect((await sign(request, partyContext(fixture.ownerPartyId))).status).toBe(200)
  expect(
    (
      await prisma.assinatura.findUniqueOrThrow({
        where: { parteContratoId: fixture.ownerPartyId },
      })
    ).ipRegistro,
  ).toBe('203.0.113.27')
})

it('serializa edição e primeira assinatura para impedir uso de PDF desatualizado', async () => {
  const proof = await createVerifiedContractProof(fixture.contractId, fixture.actorId)
  const responses = await Promise.all([
    PATCH(
      contractRequest(fixture.ownerToken, '/edit', 'PATCH', {
        ...fixture.editBody,
        amount: 1800.25,
      }),
      context(),
    ),
    sign(
      contractRequest(fixture.ownerToken, '/sign', 'POST', { documentId: proof.id }),
      partyContext(fixture.ownerPartyId),
    ),
  ])
  expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
  const contract = await prisma.contrato.findUniqueOrThrow({ where: { id: fixture.contractId } })
  const signed = await prisma.assinatura.count({
    where: { parteContrato: { contratoId: fixture.contractId }, status: 'ASSINADA' },
  })
  expect(signed).toBe(contract.revisaoDados === 0 ? 1 : 0)
})

it('ativa e gera somente uma cobrança quando as duas últimas assinaturas chegam juntas', async () => {
  const proof = await createVerifiedContractProof(fixture.contractId, fixture.actorId)
  const responses = await Promise.all(
    [fixture.ownerPartyId, fixture.tenantPartyId].map((partyId) =>
      sign(
        contractRequest(fixture.ownerToken, '/sign', 'POST', { documentId: proof.id }),
        partyContext(partyId),
      ),
    ),
  )
  expect(responses.map((response) => response.status)).toEqual([200, 200])
  expect(
    (await prisma.contrato.findUniqueOrThrow({ where: { id: fixture.contractId } })).status,
  ).toBe('ATIVO')
  expect(await prisma.cobranca.count({ where: { contratoId: fixture.contractId } })).toBe(1)
})
