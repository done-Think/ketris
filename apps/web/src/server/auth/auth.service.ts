import type { PapelUsuario } from '@prisma/client'
import bcrypt from 'bcryptjs'

import { prisma } from '@/server/db/prisma'

type AuthenticateUserInput = {
  email: string
  password: string
  tenantSlug: string
}

export type AuthenticatedUser = {
  id: string
  name: string
  email: string
  tenantId: string
  role: PapelUsuario
}

const localHostnames = new Set(['localhost', '127.0.0.1', '::1'])

function defaultTenantSlug() {
  return process.env.DEFAULT_TENANT_SLUG?.trim() || 'ketris-demo'
}

export function resolveTenantSlug(hostHeader?: string | null): string {
  if (!hostHeader) return defaultTenantSlug()

  const hostname = hostHeader
    .split(',')[0]
    .trim()
    .replace(/^\[|\]$/g, '')
    .split(':')[0]
    .toLowerCase()

  if (localHostnames.has(hostname)) return defaultTenantSlug()

  try {
    const appHostname = new URL(
      process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    ).hostname

    if (hostname === appHostname || hostname === `www.${appHostname}`) {
      return defaultTenantSlug()
    }

    if (hostname.endsWith(`.${appHostname}`)) {
      return (
        hostname
          .slice(0, -(appHostname.length + 1))
          .split('.')
          .at(-1) || defaultTenantSlug()
      )
    }
  } catch {
    return defaultTenantSlug()
  }

  return defaultTenantSlug()
}

export async function authenticateUser({
  email,
  password,
  tenantSlug,
}: AuthenticateUserInput): Promise<AuthenticatedUser | null> {
  const normalizedEmail = email.trim().toLowerCase()

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  })

  if (!tenant) return null

  const user = await prisma.usuario.findUnique({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: normalizedEmail,
      },
    },
    select: {
      id: true,
      nome: true,
      email: true,
      senhaHash: true,
      tenantId: true,
      papel: true,
    },
  })

  if (!user) return null

  const passwordMatches = await bcrypt.compare(password, user.senhaHash)
  if (!passwordMatches) return null

  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    tenantId: user.tenantId,
    role: user.papel,
  }
}
