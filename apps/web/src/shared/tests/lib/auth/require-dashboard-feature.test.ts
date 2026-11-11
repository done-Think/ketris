// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSession = vi.fn()
const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next-auth', () => ({ getServerSession }))
const redirect = vi.fn(() => {
  throw new Error('NEXT_REDIRECT')
})

vi.mock('next/navigation', () => ({ notFound }))
vi.mock('next-intl/server', () => ({ getLocale: async () => 'pt-BR' }))
vi.mock('@/i18n/navigation', () => ({ redirect }))
vi.mock('@shared/lib/auth/auth-options', () => ({ authOptions: {} }))

const { requireDashboardFeature, requireDashboardHome } =
  await import('@shared/lib/auth/require-dashboard-feature')

describe('requireDashboardFeature', () => {
  beforeEach(() => {
    getServerSession.mockReset()
    notFound.mockClear()
    redirect.mockClear()
  })

  it('lets an agency manager open the team screen', async () => {
    getServerSession.mockResolvedValue({ scope: 'tenant', role: 'OWNER', accountType: 'AGENCY' })
    await expect(requireDashboardFeature('team')).resolves.toBeUndefined()
  })

  it('hides the team screen from a team broker typing the address by hand', async () => {
    getServerSession.mockResolvedValue({ scope: 'tenant', role: 'AGENT', accountType: 'AGENCY' })
    await expect(requireDashboardFeature('team')).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('hides agency screens from an individual owner that holds the OWNER role', async () => {
    getServerSession.mockResolvedValue({
      scope: 'tenant',
      role: 'OWNER',
      accountType: 'INDIVIDUAL',
    })
    await expect(requireDashboardFeature('team')).rejects.toThrow('NEXT_NOT_FOUND')
    await expect(requireDashboardFeature('finance')).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('opens the pipeline and leads to an individual owner so proposals can be accepted', async () => {
    getServerSession.mockResolvedValue({
      scope: 'tenant',
      role: 'OWNER',
      accountType: 'INDIVIDUAL',
    })
    await expect(requireDashboardFeature('pipeline')).resolves.toBeUndefined()
    await expect(requireDashboardFeature('leads')).resolves.toBeUndefined()
  })

  it('hides everything when the account type is missing', async () => {
    getServerSession.mockResolvedValue({ scope: 'tenant', role: 'OWNER' })
    await expect(requireDashboardFeature('agenda')).rejects.toThrow('NEXT_NOT_FOUND')
  })
})

describe('requireDashboardHome', () => {
  beforeEach(() => {
    getServerSession.mockReset()
    notFound.mockClear()
    redirect.mockClear()
  })

  it.each([
    ['OWNER', 'AGENCY'],
    ['OWNER', 'BROKER'],
    ['AGENT', 'AGENCY'],
  ])('keeps the overview for %s on %s accounts', async (role, accountType) => {
    getServerSession.mockResolvedValue({ scope: 'tenant', role, accountType })
    await expect(requireDashboardHome()).resolves.toBeUndefined()
    expect(redirect).not.toHaveBeenCalled()
  })

  it.each([
    ['OWNER', 'INDIVIDUAL', '/dashboard/properties'],
    ['PROPERTY_OWNER', 'AGENCY', '/dashboard/properties'],
    ['RENTER', 'INDIVIDUAL', '/dashboard/finance/charges'],
  ])('sends %s on %s accounts to %s instead of a 404', async (role, accountType, href) => {
    getServerSession.mockResolvedValue({ scope: 'tenant', role, accountType })
    await expect(requireDashboardHome()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith({ href, locale: 'pt-BR' })
    expect(notFound).not.toHaveBeenCalled()
  })

  it('still hides the screen when the profile is unknown', async () => {
    getServerSession.mockResolvedValue({ scope: 'tenant', role: 'OWNER' })
    await expect(requireDashboardHome()).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
