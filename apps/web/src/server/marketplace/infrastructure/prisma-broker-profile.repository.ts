import { prisma } from '@server/db/prisma'

import type { BrokerProfileRepository } from '../application/ports/broker-profile-repository.port'
import type {
  BrokerListingSummary,
  BrokerProfile,
  BrokerProfileDraft,
} from '../domain/broker-profile.entity'

type DecimalLike = { toNumber(): number }

const usuarioWithPerfilInclude = {
  tenant: { select: { nome: true } },
  perfilPublico: true,
} as const

type UsuarioWithPerfilRow = {
  id: string
  tenantId: string
  nome: string
  email: string
  avatarUrl: string | null
  tenant: { nome: string }
  perfilPublico: {
    displayName: string
    headline: string | null
    bio: string | null
    creci: string | null
    telefone: string | null
    regiao: string | null
    bairros: string[]
    especialidades: string[]
    disponibilidade: string | null
    corPrimaria: string | null
    corSecundaria: string | null
    corFundo: string | null
    avatarUrl: string | null
    bannerUrl: string | null
    status: 'DRAFT' | 'PUBLISHED'
    publicadoEm: Date | null
  } | null
}

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

  async listPublished(): Promise<BrokerProfile[]> {
    const usuarios = await prisma.usuario.findMany({
      where: { perfilPublico: { status: 'PUBLISHED' } },
      include: usuarioWithPerfilInclude,
      orderBy: { perfilPublico: { publicadoEm: 'desc' } },
    })

    return Promise.all(usuarios.map((usuario) => toBrokerProfile(usuario)))
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
