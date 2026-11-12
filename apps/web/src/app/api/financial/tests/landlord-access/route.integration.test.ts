import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import {
  createLandlordScenario,
  createLandlordTenant,
  createLandlordUser,
  landlordRequest,
  linkLandlordAccount,
  removeLandlordTenants,
  routeContext,
} from '@server/shared/tests/fixtures/landlord-contract'
import { GET as listCharges } from '../../charges/route'
import { GET as readCharge } from '../../charges/[id]/route'
import { POST as payCharge } from '../../charges/[id]/payment/route'

const tenantIds: string[] = []

describe('O dono do imóvel vinculado como Locador acompanha as cobranças do contrato', () => {
  let s: Awaited<ReturnType<typeof createLandlordScenario>>

  beforeEach(async () => {
    s = await createLandlordScenario(tenantIds)
  })

  afterAll(async () => {
    await removeLandlordTenants(tenantIds)
    await prisma.$disconnect()
  })

  const list = async (token: string) =>
    (await (await listCharges(landlordRequest('financial/charges', token))).json()).items
  const read = async (token: string) =>
    (
      await readCharge(
        landlordRequest(`financial/charges/${s.charge.id}`, token),
        routeContext(s.charge.id),
      )
    ).status

  it('antes do vínculo o dono não vê as cobranças da imobiliária', async () => {
    expect(await list(s.landlord.token)).toEqual([])
    expect(await read(s.landlord.token)).toBe(404)
  })

  it('depois do vínculo o dono vê as cobranças do contrato, marcadas com a imobiliária', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    expect(await list(s.landlord.token)).toMatchObject([{ id: s.charge.id, tenantId: s.agency.id }])
    expect(await read(s.landlord.token)).toBe(200)
  })

  it('o dono vinculado não registra pagamento na cobrança da imobiliária', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    expect(
      (
        await payCharge(
          landlordRequest(`financial/charges/${s.charge.id}/payment`, s.landlord.token, {
            paidAt: '2026-10-10',
            paymentMethod: 'PIX',
          }),
          routeContext(s.charge.id),
        )
      ).status,
    ).toBe(404)
    expect((await prisma.charge.findUniqueOrThrow({ where: { id: s.charge.id } })).status).toBe(
      'PENDING',
    )
  })

  it('outra conta de dono não vê as cobranças', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    const other = await createLandlordUser(
      (await createLandlordTenant(tenantIds, 'INDIVIDUAL', 'Outra pessoa')).id,
      'OWNER',
    )
    expect(await list(other.token)).toEqual([])
    expect(await read(other.token)).toBe(404)
  })
})
