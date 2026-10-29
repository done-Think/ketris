import bcrypt from 'bcryptjs'
import { requireValue } from './staging-release-lib.mjs'

// Reserved staging fixture, separate from the full demo seed and all human accounts.
const tenantId = 'staging-ci-smoke-tenant'
const userId = 'staging-ci-smoke-user'
const slug = 'staging-ci-smoke'

export async function ensureSmokeAccount(client, { email, password }) {
  requireValue(
    email === 'staging-smoke@ketris.example.test' && password.length >= 20,
    'INVALID_SMOKE_FIXTURE_CREDENTIALS',
  )
  const hash = await bcrypt.hash(password, 12)
  await client.query('BEGIN')
  try {
    const tenants = await client.query(
      'SELECT id, slug FROM public.tenants WHERE id = $1 OR slug = $2 FOR UPDATE',
      [tenantId, slug],
    )
    requireValue(
      tenants.rows.every((row) => row.id === tenantId && row.slug === slug),
      'SMOKE_TENANT_CONFLICT',
    )
    const users = await client.query(
      'SELECT id, "tenantId", email FROM public.users WHERE id = $1 OR "tenantId" = $2 OR lower(email) = lower($3) FOR UPDATE',
      [userId, tenantId, email],
    )
    requireValue(
      users.rows.every(
        (row) => row.id === userId && row.tenantId === tenantId && row.email === email,
      ),
      'SMOKE_USER_CONFLICT',
    )
    const tenant = await client.query(
      `INSERT INTO public.tenants (id, name, slug, status, "updatedAt")
      VALUES ($1, 'Staging CI', $2, 'ACTIVE', NOW())
      ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE', "updatedAt" = NOW()
      WHERE tenants.slug = EXCLUDED.slug RETURNING id`,
      [tenantId, slug],
    )
    requireValue(tenant.rows.length === 1, 'SMOKE_TENANT_CONFLICT')
    const user = await client.query(
      `INSERT INTO public.users
      (id, "tenantId", name, email, "passwordHash", role, active, "emailVerifiedAt", "membershipApprovedAt", "updatedAt")
      VALUES ($1, $2, 'Staging CI smoke', $3, $4, 'AGENT', TRUE, NOW(), NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET "passwordHash" = $4, active = TRUE, role = 'AGENT',
        "emailVerifiedAt" = NOW(), "membershipApprovedAt" = NOW(),
        "sessionVersion" = users."sessionVersion" + 1, "updatedAt" = NOW()
      WHERE users."tenantId" = EXCLUDED."tenantId" AND users.email = EXCLUDED.email
      RETURNING id`,
      [userId, tenantId, email, hash],
    )
    requireValue(user.rows.length === 1, 'SMOKE_USER_CONFLICT')
    await client.query('COMMIT')
    return userId
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}
