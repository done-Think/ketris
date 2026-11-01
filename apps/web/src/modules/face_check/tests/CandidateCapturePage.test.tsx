import { render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'
import { CandidateCapturePage } from '../components/candidate/CandidateCapturePage'

const unmount = vi.hoisted(() => vi.fn())
vi.mock('@shared/hooks/use-tenant-session-scope', () => ({ useTenantSessionScope: vi.fn() }))
vi.mock('../components/capture/CapturePage', async () => {
  const { useEffect } = await import('react')
  return {
    CapturePage: ({ variant }: { variant: string }) => {
      useEffect(() => () => unmount(), [])
      return <div>Private capture {variant}</div>
    },
  }
})

function scope(userId = 'candidate', tenantId = 'tenant', enabled = true) {
  vi.mocked(useTenantSessionScope).mockReturnValue({
    userId,
    tenantId,
    role: 'RENTER',
    actorKey: [userId, 'RENTER'],
    enabled,
    session: null,
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  scope()
})

it('renders the authenticated capture in dashboard presentation', () => {
  render(<CandidateCapturePage token="private-token" userId="candidate" tenantId="tenant" />)
  expect(screen.getByText('Private capture dashboard')).toBeVisible()
})
it('preserves in-progress capture while the same account session is refreshing', () => {
  const view = render(
    <CandidateCapturePage token="private-token" userId="candidate" tenantId="tenant" />,
  )
  scope('candidate', 'tenant', false)
  view.rerender(<CandidateCapturePage token="private-token" userId="candidate" tenantId="tenant" />)
  expect(screen.getByText('Private capture dashboard')).toBeVisible()
  expect(unmount).not.toHaveBeenCalled()
})
it.each([
  ['other-candidate', 'tenant'],
  ['candidate', 'other-tenant'],
])('unmounts private capture when the account scope changes to %s/%s', (userId, tenantId) => {
  const view = render(
    <CandidateCapturePage token="private-token" userId="candidate" tenantId="tenant" />,
  )
  scope(userId, tenantId)
  view.rerender(<CandidateCapturePage token="private-token" userId="candidate" tenantId="tenant" />)
  expect(screen.queryByText('Private capture dashboard')).not.toBeInTheDocument()
  expect(unmount).toHaveBeenCalledOnce()
})
