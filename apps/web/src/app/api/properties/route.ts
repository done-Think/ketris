import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { authContainer } from '@server/auth/container'
import { requireBearerAuth } from '@server/auth/require-bearer-auth'
import { propertiesContainer } from '@server/properties/container'
import {
  createPropertyRequestSchema,
  listPropertiesQuerySchema,
} from '@server/properties/schemas/property-input.schema'
import { parseJsonBody, parseQuery, withErrorHandling } from '@server/shared/http'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const query = parseQuery(request, listPropertiesQuerySchema)

  const properties = await propertiesContainer.listPropertiesUseCase.execute({
    actorTenantId: actor.tenantId,
    actorId: actor.sub,
    actorPapel: actor.papel,
    locale: query.locale,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    finalidade: query.finalidade,
  })

  return NextResponse.json(properties, { status: 200 })
})

export const POST = withErrorHandling(async (request: NextRequest) => {
  const actor = await requireBearerAuth(request, authContainer.tokenService)
  const body = await parseJsonBody(request, createPropertyRequestSchema)

  const property = await propertiesContainer.createPropertyUseCase.execute({
    actorTenantId: actor.tenantId,
    actorUserId: actor.sub,
    actorPapel: actor.papel,
    proprietarioId: body.proprietarioId,
    titulo: body.titulo,
    descricao: body.descricao ?? null,
    finalidade: body.finalidade,
    tipo: body.tipo,
    anuncio: body.anuncio,
    quartos: body.quartos ?? null,
    banheiros: body.banheiros ?? null,
    vagas: body.vagas ?? null,
    areaM2: body.areaM2 ?? null,
    valor: body.valor,
    valorAluguel: body.valorAluguel ?? null,
    condominio: body.condominio ?? null,
    iptu: body.iptu ?? null,
    endereco: body.endereco
      ? {
          logradouro: body.endereco.logradouro,
          numero: body.endereco.numero,
          complemento: body.endereco.complemento ?? null,
          bairro: body.endereco.bairro,
          cidade: body.endereco.cidade,
          estado: body.endereco.estado,
          cep: body.endereco.cep,
          latitude: body.endereco.latitude ?? null,
          longitude: body.endereco.longitude ?? null,
        }
      : undefined,
    midias: body.midias,
  })

  return NextResponse.json({ property }, { status: 201 })
})
