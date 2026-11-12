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
import { GET as listContracts } from '../../route'
import { GET as readContract } from '../../[id]/route'
import { GET as readHistory } from '../../[id]/history/route'
import { POST as closeContract } from '../../[id]/close/route'

const tenantIds: string[] = []

describe('O dono do imóvel vinculado como Locador consulta o contrato da imobiliária', () => {
  let s: Awaited<ReturnType<typeof createLandlordScenario>>

  beforeEach(async () => {
    s = await createLandlordScenario(tenantIds)
  })

  afterAll(async () => {
    await removeLandlordTenants(tenantIds)
    await prisma.$disconnect()
  })

  async function reads(token: string) {
    const contract = await readContract(
      landlordRequest(`contracts/${s.contract.id}`, token),
      routeContext(s.contract.id),
    )
    const history = await readHistory(
      landlordRequest(`contracts/${s.contract.id}/history`, token),
      routeContext(s.contract.id),
    )
    const list = await (await listContracts(landlordRequest('contracts', token))).json()
    return { contract: contract.status, history: history.status, listed: list.items.length }
  }

  it('antes do vínculo o dono não vê o contrato', async () => {
    expect(await reads(s.landlord.token)).toEqual({ contract: 404, history: 404, listed: 0 })
  })

  it('depois do vínculo o dono lista e abre o contrato com o nome da imobiliária, sem poder editar', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    expect(await reads(s.landlord.token)).toEqual({ contract: 200, history: 200, listed: 1 })
    const list = await (await listContracts(landlordRequest('contracts', s.landlord.token))).json()
    expect(list.items).toMatchObject([
      {
        id: s.contract.id,
        tenantId: s.agency.id,
        agencyName: 'Imobiliária Parceira',
        canEdit: false,
      },
    ])
    const detail = await (
      await readContract(
        landlordRequest(`contracts/${s.contract.id}`, s.landlord.token),
        routeContext(s.contract.id),
      )
    ).json()
    expect(detail.contract).toMatchObject({
      tenantId: s.agency.id,
      agencyName: 'Imobiliária Parceira',
    })
  })

  it('o dono vinculado não encerra o contrato da imobiliária', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    expect(
      (
        await closeContract(
          landlordRequest(`contracts/${s.contract.id}/close`, s.landlord.token, { reason: 'fim' }),
          routeContext(s.contract.id),
        )
      ).status,
    ).toBe(404)
    expect((await prisma.contract.findUniqueOrThrow({ where: { id: s.contract.id } })).status).toBe(
      'ACTIVE',
    )
  })

  it('outra conta de dono continua sem ver o contrato', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    const other = await createLandlordUser(
      (await createLandlordTenant(tenantIds, 'INDIVIDUAL', 'Outra pessoa')).id,
      'OWNER',
    )
    expect(await reads(other.token)).toEqual({ contract: 404, history: 404, listed: 0 })
  })

  it('a imobiliária continua vendo o contrato como antes', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    const list = await (await listContracts(landlordRequest('contracts', s.admin.token))).json()
    expect(list.items).toMatchObject([
      { id: s.contract.id, canEdit: false, agencyName: 'Imobiliária Parceira' },
    ])
  })
})
