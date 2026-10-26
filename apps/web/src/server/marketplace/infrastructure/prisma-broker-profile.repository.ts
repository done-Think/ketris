import { Prisma } from '@prisma/client'

import { prisma } from '@server/db/prisma'

import type { BrokerProfileRepository } from '../application/ports/broker-profile-repository.port'
import type {
  BrokerListingSummary,
  BrokerProfile,
  BrokerProfileDraft,
} from '../types/broker-profile'
import type { DecimalLike, UsuarioWithPerfilRow } from '../types/prisma-broker-profile-repository'
import type {
  ProfileDirectoryFilters,
  ProfileDirectoryPage,
  ProfileDirectoryResult,
} from '../types/profile-directory'
import {
  orderByIds,
  profileSearchCondition,
  PUBLISHED_PROFILE_STATUS,
} from './profile-directory-search'

const usuarioWithPerfilInclude = {
  tenant: { select: { nome: true } },
  perfilPublico: true,
} as const

async function buildStats(usuarioId: string) {
  const [activeListings, dealsClosed] = await Promise.all([
    prisma.imovel.count({ where: { responsavelId: usuarioId, status: 'PUBLISHED' } }),
    prisma.contrato.count({ where: { status: 'ATIVO', imovel: { responsavelId: usuarioId } } }),
  ])

  return { activeListings, dealsClosed }
}

async function buildRecentListings(usuarioId: string): Promise<BrokerListingSummary[]> {
  const imoveis = await prisma.imovel.findMany({
    where: { responsavelId: usuarioId, status: 'PUBLISHED' },
    orderBy: { publicadoEm: 'desc' },
    take: 3,
    select: {
      id: true,
      titulo: true,
      finalidade: true,
      valor: true,
      endereco: { select: { bairro: true, cidade: true } },
      midias: { orderBy: { ordem: 'asc' }, take: 1, select: { url: true } },
    },
  })

  return imoveis.map((imovel) => ({
    id: imovel.id,
    title: imovel.titulo,
    purpose: imovel.finalidade,
    price: (imovel.valor as unknown as DecimalLike).toNumber(),
    neighborhood: imovel.endereco?.bairro ?? null,
    city: imovel.endereco?.cidade ?? null,
    coverUrl: imovel.midias[0]?.url ?? null,
  }))
}

async function toBrokerProfile(usuario: UsuarioWithPerfilRow): Promise<BrokerProfile> {
  const perfil = usuario.perfilPublico
  const [stats, recentListings] = await Promise.all([
    buildStats(usuario.id),
    buildRecentListings(usuario.id),
  ])

  return {
    id: usuario.id,
    tenantId: usuario.tenantId,
    agencyName: usuario.tenant.nome,
    email: usuario.email,
    displayName: perfil?.displayName ?? usuario.nome,
    headline: perfil?.headline ?? null,
    bio: perfil?.bio ?? null,
    creci: perfil?.creci ?? null,
    phone: perfil?.telefone ?? null,
    region: perfil?.regiao ?? null,
    neighborhoods: perfil?.bairros ?? [],
    specialties: perfil?.especialidades ?? [],
    availability: perfil?.disponibilidade ?? null,
    primaryColor: perfil?.corPrimaria ?? null,
    secondaryColor: perfil?.corSecundaria ?? null,
    backgroundColor: perfil?.corFundo ?? null,
    avatarUrl: perfil?.avatarUrl ?? usuario.avatarUrl,
    bannerUrl: perfil?.bannerUrl ?? null,
    status: perfil?.status ?? 'DRAFT',
    publishedAt: perfil?.publicadoEm ?? null,
    stats,
    recentListings,
  }
}

export class PrismaBrokerProfileRepository implements BrokerProfileRepository {
  async findByUsuarioId(usuarioId: string): Promise<BrokerProfile | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: usuarioWithPerfilInclude,
    })

    if (!usuario || !usuario.perfilPublico) return null

    return toBrokerProfile(usuario)
  }

  async findPublishedById(usuarioId: string): Promise<BrokerProfile | null> {
    const usuario = await prisma.usuario.findFirst({
      where: { id: usuarioId, perfilPublico: { status: 'PUBLISHED' } },
      include: usuarioWithPerfilInclude,
    })

    if (!usuario) return null

    return toBrokerProfile(usuario)
  }

  async listPublished(
    { q }: ProfileDirectoryFilters,
    { page, pageSize }: ProfileDirectoryPage,
  ): Promise<ProfileDirectoryResult<BrokerProfile>> {
    const where = Prisma.sql`p.status::text = ${PUBLISHED_PROFILE_STATUS} AND ${profileSearchCondition(
      Prisma.sql`concat_ws(' ', p."displayName", p.creci, p.regiao, array_to_string(p.bairros, ' '), array_to_string(p.especialidades, ' '))`,
      q,
    )}`
    const [rows, [{ total }]] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT p."usuarioId" AS id FROM perfis_publicos_corretor p WHERE ${where}
        ORDER BY p."publicadoEm" DESC NULLS LAST, p."usuarioId"
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      prisma.$queryRaw<{ total: number }[]>`
        SELECT count(*)::int AS total FROM perfis_publicos_corretor p WHERE ${where}`,
    ])
    const ids = rows.map((row) => row.id)
    const usuarios = await prisma.usuario.findMany({
      where: { id: { in: ids } },
      include: usuarioWithPerfilInclude,
    })
    const profiles = await Promise.all(usuarios.map((usuario) => toBrokerProfile(usuario)))

    return { items: orderByIds(ids, profiles, (profile) => profile.id), totalCount: total }
  }

  async save(usuarioId: string, draft: BrokerProfileDraft): Promise<BrokerProfile> {
    const data = {
      displayName: draft.displayName,
      headline: draft.headline,
      bio: draft.bio,
      creci: draft.creci,
      telefone: draft.phone,
      regiao: draft.region,
      bairros: draft.neighborhoods,
      especialidades: draft.specialties,
      disponibilidade: draft.availability,
      corPrimaria: draft.primaryColor,
      corSecundaria: draft.secondaryColor,
      corFundo: draft.backgroundColor,
      avatarUrl: draft.avatarUrl,
      bannerUrl: draft.bannerUrl,
    }

    await prisma.perfilPublicoCorretor.upsert({
      where: { usuarioId },
      create: { usuarioId, ...data },
      update: data,
    })

    const saved = await this.findByUsuarioId(usuarioId)

    if (!saved) {
      throw new Error('Falha ao salvar o perfil público de corretor.')
    }

    return saved
  }

  async setStatus(
    usuarioId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<BrokerProfile | null> {
    const existing = await prisma.perfilPublicoCorretor.findUnique({
      where: { usuarioId },
      select: { usuarioId: true },
    })

    if (!existing) return null

    await prisma.perfilPublicoCorretor.update({
      where: { usuarioId },
      data: { status, publicadoEm: publishedAt },
    })

    return this.findByUsuarioId(usuarioId)
  }
}
