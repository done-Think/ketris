import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '@server/db/prisma'
import {
  createLandlordScenario,
  createLandlordTenant,
  createLandlordUser,
  landlordRequest,
  removeLandlordTenants,
} from '@server/shared/tests/fixtures/landlord-contract'
import { POST as confirmLink } from '../../[id]/parties/[partyId]/link-user/route'

const tenantIds: string[] = []

describe('A imobiliária vincula a parte Locador à conta do dono do imóvel', () => {
  let s: Awaited<ReturnType<typeof createLandlordScenario>>

  beforeEach(async () => {
    s = await createLandlordScenario(tenantIds)
  })

  afterAll(async () => {
    await removeLandlordTenants(tenantIds)
    await prisma.$disconnect()
  })

  function link(token = s.admin.token, email = s.landlord.email) {
    return confirmLink(
      landlordRequest(`contracts/${s.contract.id}/parties/${s.party.id}/link-user`, token, {
        email,
      }),
      { params: Promise.resolve({ id: s.contract.id, partyId: s.party.id }) },
    )
  }

  const linkedUser = async () =>
    (await prisma.contractParty.findUniqueOrThrow({ where: { id: s.party.id } })).userId

  it('vincula a parte Locador à conta de dono de imóvel com o mesmo e-mail', async () => {
    expect((await link()).status).toBe(200)
    expect(await linkedUser()).toBe(s.landlord.id)
    expect((await link()).status).toBe(200)
  })

  it('recusa conta de outro e-mail, de locatário, inativa ou de imobiliária', async () => {
    const other = await createLandlordUser(
      (await createLandlordTenant(tenantIds, 'INDIVIDUAL', 'Outra pessoa')).id,
      'OWNER',
    )
    expect((await link(s.admin.token, other.email)).status).toBe(409)
    await prisma.user.update({ where: { id: s.landlord.id }, data: { active: false } })
    expect((await link()).status).toBe(404)
    await prisma.user.update({
      where: { id: s.landlord.id },
      data: { active: true, role: 'RENTER' },
    })
    expect((await link()).status).toBe(404)
    await prisma.user.update({ where: { id: s.landlord.id }, data: { role: 'OWNER' } })
    await prisma.tenant.update({
      where: { id: s.landlord.tenantId },
      data: { accountType: 'AGENCY' },
    })
    expect((await link()).status).toBe(404)
    expect(await linkedUser()).toBeNull()
  })

  it('só a gestão da imobiliária do contrato pode vincular', async () => {
    expect((await link(s.agent.token)).status).toBe(403)
    expect((await link(s.landlord.token)).status).toBe(404)
    expect(await linkedUser()).toBeNull()
  })
})
