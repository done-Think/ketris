import type { PrismaClient } from '@prisma/client'

import { seedTenants } from './seed-data'

const agencySlugs = new Set(['ketris-demo', 'imobiliaria-vale-verde', 'imobiliaria-boa-vista'])

export async function seedPublicProfiles(
  prisma: Pick<PrismaClient, 'tenant' | 'brokerPublicProfile' | 'agencyPublicProfile'>,
) {
  let brokers = 0
  let agencies = 0

  for (const [index, fixture] of seedTenants.entries()) {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug: fixture.slug },
      include: {
        users: { where: { email: { in: fixture.members.map((member) => member.email) } } },
      },
    })
    if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') continue
    const eligibleUsers = tenant.users.filter(
      (user) =>
        user.active &&
        user.membershipApprovedAt !== null &&
        (user.role === 'AGENT' || (tenant.accountType === 'BROKER' && user.role === 'OWNER')),
    )

    for (const user of eligibleUsers) {
      await prisma.brokerPublicProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          displayName: user.name,
          headline: 'Consultoria em imóveis residenciais',
          bio: 'Perfil de demonstração para conhecer imóveis, equipe e atendimento da plataforma.',
          creci: user.creci || `CRECI ${String(index + 1).padStart(6, '0')}-F`,
          phone: user.phone || '(11) 00000-0000',
          region: 'São Paulo, SP',
          neighborhoods: ['Jardins', 'Pinheiros', 'Vila Madalena'],
          specialties: ['Locação', 'Compra e venda'],
          availability: 'Segunda a sexta, das 9h às 18h',
          primaryColor: tenant.primaryColor || '#F30274',
          secondaryColor: tenant.secondaryColor || '#212631',
          backgroundColor: '#FFFFFF',
          avatarUrl: user.avatarUrl || '/demo/profile-avatar.svg',
          bannerUrl: '/demo/profile-banner.svg',
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      })
      brokers += 1
    }

    if (!agencySlugs.has(fixture.slug)) continue
    const team = tenant.users.filter(
      (user) =>
        user.active &&
        user.membershipApprovedAt !== null &&
        (user.role === 'OWNER' || user.role === 'AGENT'),
    )
    const owner = team.find((user) => user.role === 'OWNER')
    await prisma.agencyPublicProfile.upsert({
      where: { tenantId: tenant.id },
      update: {},
      create: {
        tenantId: tenant.id,
        displayName: tenant.name,
        headline: 'Imóveis para morar e investir em São Paulo',
        summary:
          'Imobiliária de demonstração com equipe e imóveis vinculados aos cadastros locais.',
        legalCreci: `CRECI ${String(index + 1).padStart(6, '0')}-J`,
        headquarters: 'São Paulo, SP',
        address: 'Endereço de demonstração, São Paulo, SP',
        phone: '(11) 0000-0000',
        email: owner?.email || fixture.members[0].email,
        coverage: ['Jardins', 'Pinheiros', 'Vila Madalena'],
        segments: ['Residencial', 'Locação', 'Compra e venda'],
        yearsInMarket: 5,
        backgroundColor: '#FFFFFF',
        logoUrl: '/demo/agency-logo.svg',
        bannerUrl: '/demo/profile-banner.svg',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        highlights: {
          create: team.slice(0, 6).map((user, position) => ({ userId: user.id, position })),
        },
      },
    })
    agencies += 1
  }

  return { brokers, agencies }
}
