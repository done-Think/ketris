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
    const tenant = await prisma.tenant.create({ data: { nome: 'Author FK', slug } })
    tenantId = tenant.id
    const author = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Autora removida',
        email: slug + '@example.test',
        senhaHash: 'x',
        papel: 'OWNER',
      },
    })
    const manager = await prisma.usuario.create({
      data: {
        tenantId,
        nome: 'Gestora',
        email: 'manager-' + slug + '@example.test',
        senhaHash: 'x',
        papel: 'OWNER',
      },
    })
    const property = await prisma.imovel.create({
      data: {
        tenantId,
        responsavelId: manager.id,
        titulo: 'Imóvel FK',
        finalidade: 'ALUGUEL',
        tipo: 'CASA',
        valor: 1,
      },
    })
    const ticket = await prisma.chamadoManutencao.create({
      data: {
        tenantId,
        imovelId: property.id,
        categoria: 'OTHER',
        titulo: 'Chamado',
        descricao: 'Descrição',
        abertoPorId: author.id,
        abertoPorNome: author.nome,
        atividades: {
          create: { tipo: 'NOTA', mensagem: 'Nota', autorId: author.id, autorNome: author.nome },
        },
      },
    })

    await expect(
      prisma.chamadoManutencao.update({
        where: { id: ticket.id },
        data: { concluidoPorId: 'missing-user' },
      }),
    ).rejects.toThrow()

    await prisma.usuario.delete({ where: { id: author.id } })

    const stored = await prisma.chamadoManutencao.findUniqueOrThrow({
      where: { id: ticket.id },
      include: { atividades: true },
    })
    expect(stored).toMatchObject({ abertoPorId: null, abertoPorNome: 'Autora removida' })
    expect(stored.atividades[0]).toMatchObject({ autorId: null, autorNome: 'Autora removida' })
  })
})
