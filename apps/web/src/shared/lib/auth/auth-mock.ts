import type { User } from 'next-auth'

/**
 * Login simulado para deploys de preview sem banco de dados acessível (ex.: Vercel Preview antes
 * do Postgres estar provisionado). Existe fora de `auth-options.ts` para que o guard de produção
 * fique isolado e testável (ver `auth-mock.test.ts`).
 *
 * Duas travas independentes, ambas precisam ceder:
 *  1. `AUTH_MOCK_ENABLED=true` precisa estar setado explicitamente — nunca liga sozinho.
 *  2. Nunca ativa quando `VERCEL_ENV === 'production'`, mesmo com a flag ligada — a Vercel builda
 *     Preview e Production com `NODE_ENV=production`, então NODE_ENV não serve para essa distinção
 *     (é a mesma razão do erro NO_SECRET do next-auth: ele também olha NODE_ENV, não VERCEL_ENV).
 *     Um build de produção rodado fora da Vercel (sem VERCEL_ENV) com NODE_ENV=production também é
 *     bloqueado, por segurança — a flag só liga em ambientes reconhecidamente não-produtivos.
 */
export function isAuthMockEnabled(): boolean {
  if (process.env.AUTH_MOCK_ENABLED !== 'true') return false
  if (process.env.VERCEL_ENV === 'production') return false
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) return false

  return true
}

function getMockCredentials() {
  return {
    email: process.env.AUTH_MOCK_EMAIL ?? 'demo@ketris.dev',
    password: process.env.AUTH_MOCK_PASSWORD ?? 'demo123456',
  }
}

export function matchesMockCredentials(email: string, password: string): boolean {
  const mock = getMockCredentials()

  return email === mock.email && password === mock.password
}

/**
 * Usuário fixo, sem qualquer consulta ao banco. `accessToken`/`refreshToken` são strings opacas —
 * de propósito, não passam pelo `JoseTokenService` real. Isso desacopla o mock de
 * `AUTH_TOKEN_SECRET`, e como consequência qualquer rota de API que exija Bearer real (tudo que
 * não seja tela alimentada por fixture) recebe 401 em vez de dado inventado — a simulação cobre
 * só a tela de login e as telas com dado de fixture, nunca finge dado de backend real.
 */
export function buildMockTenantUser(): User {
  return {
    id: 'mock-user',
    name: 'Usuário Demo',
    email: getMockCredentials().email,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    scope: 'tenant',
    tenantId: 'mock-tenant',
    papel: 'ADMIN',
  }
}
