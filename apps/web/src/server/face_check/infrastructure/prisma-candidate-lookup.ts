import { Prisma } from '@prisma/client'
import { normalizeEmail } from '@server/shared/normalize-email'
import type { FaceCheckDatabase } from '../types/access'
import { faceCheckContactEmail } from '../utils/contact-email'

export class PrismaFaceCheckCandidateLookup {
  constructor(private readonly database: FaceCheckDatabase) {}

  private matches(email: string, tenantId?: string) {
    return this.database.$queryRaw<{ id: string; email: string }[]>(Prisma.sql`
      SELECT "id", "email" FROM "users"
      WHERE "active" = true AND "emailVerifiedAt" IS NOT NULL
        AND lower(btrim("email")) = ${email}
        ${tenantId === undefined ? Prisma.empty : Prisma.sql`AND "tenantId" = ${tenantId}`}
      ORDER BY "id" ASC
      LIMIT 2
    `)
  }

  async findForContact(tenantId: string, contact: string | null): Promise<string | null> {
    const email = faceCheckContactEmail(contact)
    if (!email) return null
    // Literal equality avoids ILIKE treating contact characters as SQL patterns.
    const local = await this.matches(email, tenantId)
    if (local.length)
      return local.length === 1 && normalizeEmail(local[0].email) === email ? local[0].id : null
    // Emails are only unique inside a tenant. A second global match makes association ambiguous.
    const global = await this.matches(email)
    return global.length === 1 && normalizeEmail(global[0].email) === email ? global[0].id : null
  }
}
