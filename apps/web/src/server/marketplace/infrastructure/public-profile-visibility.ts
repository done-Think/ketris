import { Prisma } from '@prisma/client'

const visibleTenantStatuses = ['TRIAL', 'ACTIVE'] as const

export const publicTenantEligibility = {
  status: { in: [...visibleTenantStatuses] },
} satisfies Prisma.TenantWhereInput

export const publicBrokerEligibility = {
  active: true,
  role: { in: ['OWNER', 'AGENT'] },
  membershipApprovedAt: { not: null },
  NOT: { teamInvitation: { is: { acceptedAt: null } } },
  tenant: publicTenantEligibility,
} satisfies Prisma.UserWhereInput

export const publishedBrokerEligibility = {
  status: 'PUBLISHED',
  user: publicBrokerEligibility,
} satisfies Prisma.BrokerPublicProfileWhereInput

export const publicTenantSql = Prisma.sql`t.status IN (${Prisma.join(visibleTenantStatuses)})`

export const publishedBrokerSql = Prisma.sql`
  p.status = 'PUBLISHED' AND u.active = true AND u."membershipApprovedAt" IS NOT NULL
  AND u.role IN ('OWNER', 'AGENT')
  AND NOT EXISTS (
    SELECT 1 FROM team_invitations ti WHERE ti."userId" = u.id AND ti."acceptedAt" IS NULL
  )
  AND ${publicTenantSql}
`

export const publishedAgencySql = Prisma.sql`p.status = 'PUBLISHED' AND ${publicTenantSql}`
