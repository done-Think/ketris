// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getServerSession = vi.fn()
const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next-auth', () => ({ getServerSession }))
vi.mock('next/navigation', () => ({ notFound }))
vi.mock('@shared/lib/auth/auth-options', () => ({ authOptions: {} }))

const { requireDashboardFeature } = await import('@shared/lib/auth/require-dashboard-feature')

describe('requireDashboardFeature', () => {
  beforeEach(() => {
    getServerSession.mockReset()
    notFound.mockClear()
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
    await expect(requireDashboardFeature('leads')).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('hides everything when the account type is missing', async () => {
    getServerSession.mockResolvedValue({ scope: 'tenant', role: 'OWNER' })
    await expect(requireDashboardFeature('agenda')).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
