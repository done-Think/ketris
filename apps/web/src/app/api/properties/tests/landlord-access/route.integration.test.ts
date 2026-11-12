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
import { GET as listProperties } from '../../route'
import { GET as readProperty, PATCH as editProperty } from '../../[id]/route'

const tenantIds: string[] = []
const ids = (items: { id: string }[]) => items.map((item) => item.id).sort()

describe('O dono do imóvel vinculado como Locador vê o imóvel alugado pela imobiliária', () => {
  let s: Awaited<ReturnType<typeof createLandlordScenario>>

  beforeEach(async () => {
    s = await createLandlordScenario(tenantIds)
  })

  afterAll(async () => {
    await removeLandlordTenants(tenantIds)
    await prisma.$disconnect()
  })

  const list = async (token: string) =>
    (await (await listProperties(landlordRequest('properties', token))).json()).properties
  const read = async (token: string) =>
    (
      await readProperty(
        landlordRequest(`properties/${s.property.id}`, token),
        routeContext(s.property.id),
      )
    ).status

  it('antes do vínculo o dono vê só os imóveis da própria conta', async () => {
    expect(ids(await list(s.landlord.token))).toEqual([s.ownProperty.id])
    expect(await read(s.landlord.token)).toBe(404)
  })

  it('depois do vínculo o dono vê o imóvel alugado com o nome da imobiliária', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    const properties = await list(s.landlord.token)
    expect(ids(properties)).toEqual([s.ownProperty.id, s.property.id].sort())
    expect(properties.find((item: { id: string }) => item.id === s.property.id)).toMatchObject({
      tenantId: s.agency.id,
      agencyName: 'Imobiliária Parceira',
    })
    expect(await read(s.landlord.token)).toBe(200)
  })

  it('o dono vinculado não edita o imóvel da imobiliária', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    expect(
      (
        await editProperty(
          landlordRequest(
            `properties/${s.property.id}`,
            s.landlord.token,
            { title: 'Outro' },
            'PATCH',
          ),
          routeContext(s.property.id),
        )
      ).status,
    ).toBe(404)
    expect((await prisma.property.findUniqueOrThrow({ where: { id: s.property.id } })).title).toBe(
      'Apartamento da Paula',
    )
  })

  it('outra conta de dono não vê o imóvel', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    const other = await createLandlordUser(
      (await createLandlordTenant(tenantIds, 'INDIVIDUAL', 'Outra pessoa')).id,
      'OWNER',
    )
    expect(await list(other.token)).toEqual([])
    expect(await read(other.token)).toBe(404)
  })

  it('com o contrato encerrado o imóvel sai da lista do dono', async () => {
    await linkLandlordAccount(s.party.id, s.landlord.id)
    await prisma.contract.update({ where: { id: s.contract.id }, data: { status: 'CLOSED' } })
    expect(ids(await list(s.landlord.token))).toEqual([s.ownProperty.id])
    expect(await read(s.landlord.token)).toBe(404)
  })
})
