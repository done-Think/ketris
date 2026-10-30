export interface SessionCookieInput {
  tenantId: string
  email: string
  accessToken: string
  refreshToken: string
}

export interface SessionCookieFixtures {
  current: string
  retired: string
}
