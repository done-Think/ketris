import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'

import { prisma } from '@server/db/prisma'

describe('maintenance author foreign keys', () => {
  const slug = 'author-fk-' + randomUUID()
  let tenantId = ''

  afterAll(async () => {
    if (tenantId) await prisma.tenant.delete({ where: { id: tenantId } })
    await prisma.$disconnect()
  })

  it('keeps the ticket and the author name when the author is removed', async () => {
    const tenant = await prisma.tenant.create({ data: { name: 'Author FK', slug } })
    tenantId = tenant.id
    const author = await prisma.user.create({
      data: {
        tenantId,
        name: 'Autora removida',
        email: slug + '@example.test',
        passwordHash: 'x',
        role: 'OWNER',
      },
    })
    const manager = await prisma.user.create({
      data: {
        tenantId,
        name: 'Gestora',
        email: 'manager-' + slug + '@example.test',
        passwordHash: 'x',
        role: 'OWNER',
      },
    })
    const property = await prisma.property.create({
      data: {
        tenantId,
        responsibleId: manager.id,
        title: 'Imóvel FK',
        purpose: 'RENT',
        type: 'HOUSE',
        price: 1,
      },
    })
    const ticket = await prisma.maintenanceTicket.create({
      data: {
        tenantId,
        propertyId: property.id,
        category: 'OTHER',
        title: 'Chamado',
        description: 'Descrição',
        openedById: author.id,
        openedByName: author.name,
        activities: {
          create: { type: 'NOTE', message: 'Nota', authorId: author.id, authorName: author.name },
        },
      },
    })

    await expect(
      prisma.maintenanceTicket.update({
        where: { id: ticket.id },
        data: { completedById: 'missing-user' },
      }),
    ).rejects.toThrow()

    await prisma.user.delete({ where: { id: author.id } })

    const stored = await prisma.maintenanceTicket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: { activities: true },
    })
    expect(stored).toMatchObject({ openedById: null, openedByName: 'Autora removida' })
    expect(stored.activities[0]).toMatchObject({ authorId: null, authorName: 'Autora removida' })
  })
})
