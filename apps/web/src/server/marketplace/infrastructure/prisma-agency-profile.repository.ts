import { prisma } from '@server/db/prisma'

import type { AgencyProfileRepository } from '../application/ports/agency-profile-repository.port'
import type {
  AgencyListingSummary,
  AgencyProfile,
  AgencyProfileDraft,
  AgencyTeamHighlight,
} from '../domain/agency-profile.entity'

type DecimalLike = { toNumber(): number }

const tenantWithPerfilInclude = {
  perfilPublico: {
    include: {
      destaques: {
        orderBy: { ordem: 'asc' as const },
        include: { usuario: { select: { id: true, nome: true, avatarUrl: true } } },
      },
    },
  },
}

type TenantWithPerfilRow = {
  id: string
  nome: string
  corPrimaria: string | null
  corSecundaria: string | null
  perfilPublico: {
    displayName: string
    headline: string | null
    resumo: string | null
    legalCreci: string | null
    sede: string | null
    endereco: string | null
    telefone: string | null
    email: string | null
    cobertura: string[]
    segmentos: string[]
    anosDeMercado: number | null
    corFundo: string | null
    logoUrl: string | null
    bannerUrl: string | null
    status: 'DRAFT' | 'PUBLISHED'
    publicadoEm: Date | null
    destaques: { ordem: number; usuario: { id: string; nome: string; avatarUrl: string | null } }[]
  } | null
}

async function buildStats(tenantId: string) {
  const [activeListings, brokersCount, dealsClosed] = await Promise.all([
    prisma.imovel.count({ where: { tenantId, status: 'PUBLISHED' } }),
    prisma.usuario.count({
      where: { tenantId, ativo: true, papel: { in: ['ADMIN', 'OWNER', 'AGENT'] } },
    }),
    prisma.contrato.count({ where: { tenantId, status: 'ATIVO' } }),
  ])

  return { activeListings, brokersCount, dealsClosed }
}

async function buildFeaturedListings(tenantId: string): Promise<AgencyListingSummary[]> {
  const imoveis = await prisma.imovel.findMany({
    where: { tenantId, status: 'PUBLISHED' },
    orderBy: { publicadoEm: 'desc' },
    take: 4,
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

function toTeam(perfil: TenantWithPerfilRow['perfilPublico']): AgencyTeamHighlight[] {
  if (!perfil) return []

  return perfil.destaques.map((destaque) => ({
    usuarioId: destaque.usuario.id,
    name: destaque.usuario.nome,
    avatarUrl: destaque.usuario.avatarUrl,
    order: destaque.ordem,
  }))
}

async function toAgencyProfile(tenant: TenantWithPerfilRow): Promise<AgencyProfile> {
  const perfil = tenant.perfilPublico
  const [stats, featuredListings] = await Promise.all([
    buildStats(tenant.id),
    buildFeaturedListings(tenant.id),
  ])

  return {
    id: tenant.id,
    displayName: perfil?.displayName ?? tenant.nome,
    headline: perfil?.headline ?? null,
    summary: perfil?.resumo ?? null,
    legalCreci: perfil?.legalCreci ?? null,
    headquarters: perfil?.sede ?? null,
    address: perfil?.endereco ?? null,
    phone: perfil?.telefone ?? null,
    email: perfil?.email ?? null,
    coverage: perfil?.cobertura ?? [],
    segments: perfil?.segmentos ?? [],
    yearsInMarket: perfil?.anosDeMercado ?? null,
    primaryColor: tenant.corPrimaria,
    secondaryColor: tenant.corSecundaria,
    backgroundColor: perfil?.corFundo ?? null,
    logoUrl: perfil?.logoUrl ?? null,
    bannerUrl: perfil?.bannerUrl ?? null,
    status: perfil?.status ?? 'DRAFT',
    publishedAt: perfil?.publicadoEm ?? null,
    stats,
    team: toTeam(perfil),
    featuredListings,
  }
}

export class PrismaAgencyProfileRepository implements AgencyProfileRepository {
  async findByTenantId(tenantId: string): Promise<AgencyProfile | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: tenantWithPerfilInclude,
    })

    if (!tenant || !tenant.perfilPublico) return null

    return toAgencyProfile(tenant)
  }

  async findPublishedById(tenantId: string): Promise<AgencyProfile | null> {
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId, perfilPublico: { status: 'PUBLISHED' } },
      include: tenantWithPerfilInclude,
    })

    if (!tenant) return null

    return toAgencyProfile(tenant)
  }

  async listPublished(): Promise<AgencyProfile[]> {
    const tenants = await prisma.tenant.findMany({
      where: { perfilPublico: { status: 'PUBLISHED' } },
      include: tenantWithPerfilInclude,
      orderBy: { perfilPublico: { publicadoEm: 'desc' } },
    })

    return Promise.all(tenants.map((tenant) => toAgencyProfile(tenant)))
  }

  async save(tenantId: string, draft: AgencyProfileDraft): Promise<AgencyProfile> {
    // Só aceita destacar usuários que realmente pertencem a este tenant — nunca confia
    // cegamente nos ids recebidos do cliente.
    const validUsuarioIds =
      draft.team.length > 0
        ? new Set(
            (
              await prisma.usuario.findMany({
                where: { tenantId, id: { in: draft.team.map((member) => member.usuarioId) } },
                select: { id: true },
              })
            ).map((usuario) => usuario.id),
          )
        : new Set<string>()

    const data = {
      displayName: draft.displayName,
      headline: draft.headline,
      resumo: draft.summary,
      legalCreci: draft.legalCreci,
      sede: draft.headquarters,
      endereco: draft.address,
      telefone: draft.phone,
      email: draft.email,
      cobertura: draft.coverage,
      segmentos: draft.segments,
      anosDeMercado: draft.yearsInMarket,
      corFundo: draft.backgroundColor,
      logoUrl: draft.logoUrl,
      bannerUrl: draft.bannerUrl,
    }

    await prisma.$transaction(async (transaction) => {
      const perfil = await transaction.perfilPublicoImobiliaria.upsert({
        where: { tenantId },
        create: { tenantId, ...data },
        update: data,
        select: { id: true },
      })

      await transaction.perfilPublicoImobiliariaDestaque.deleteMany({
        where: { perfilId: perfil.id },
      })

      const validTeam = draft.team.filter((member) => validUsuarioIds.has(member.usuarioId))

      if (validTeam.length > 0) {
        await transaction.perfilPublicoImobiliariaDestaque.createMany({
          data: validTeam.map((member) => ({
            perfilId: perfil.id,
            usuarioId: member.usuarioId,
            ordem: member.order,
          })),
        })
      }
    })

    const saved = await this.findByTenantId(tenantId)

    if (!saved) {
      throw new Error('Falha ao salvar o perfil público da imobiliária.')
    }

    return saved
  }

  async setStatus(
    tenantId: string,
    status: 'DRAFT' | 'PUBLISHED',
    publishedAt: Date | null,
  ): Promise<AgencyProfile | null> {
    const existing = await prisma.perfilPublicoImobiliaria.findUnique({
      where: { tenantId },
      select: { tenantId: true },
    })

    if (!existing) return null

    await prisma.perfilPublicoImobiliaria.update({
      where: { tenantId },
      data: { status, publicadoEm: publishedAt },
    })

    return this.findByTenantId(tenantId)
  }
}
