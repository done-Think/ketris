import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyInstagramPanel } from '../../components/PropertyInstagramPanel'
import { dashboardProperties } from '../fixtures/dashboard-properties'
import type { InstagramPublicationState } from '@shared/types/instagram'

const mocks = vi.hoisted(() => ({
  role: 'AGENT',
  publications: [] as InstagramPublicationState[],
  connection: vi.fn(),
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { role: mocks.role } }) }))
vi.mock('@shared/hooks/use-instagram', () => ({
  useInstagramConnection: mocks.connection,
  useInstagramPublications: () => ({
    data: { publications: mocks.publications },
    isPending: false,
    isError: false,
  }),
}))
vi.mock('@shared/components/integrations/InstagramConnectionCard', () => ({
  InstagramConnectionCard: () => null,
}))
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: vi.fn() }) }))

const property = { ...dashboardProperties[0], apiStatus: 'PUBLISHED' as const }
beforeEach(() => {
  mocks.role = 'AGENT'
  mocks.publications = []
  mocks.connection.mockReset().mockReturnValue({
    data: {
      configured: true,
      connected: true,
      expired: false,
      accountId: 'current-account',
      username: 'my-account',
    },
  })
})

describe('Personal Instagram publication panel', () => {
  it.each(['OWNER', 'AGENT', 'PROPERTY_OWNER'])('shows the review to an eligible %s', (role) => {
    mocks.role = role
    render(<PropertyInstagramPanel property={property} />)
    expect(screen.getByRole('button', { name: 'Revisar publicação no Instagram' })).toBeEnabled()
  })

  it('hides publication controls from renters', () => {
    mocks.role = 'RENTER'
    const { container } = render(<PropertyInstagramPanel property={property} />)
    expect(container).toBeEmptyDOMElement()
    expect(mocks.connection).not.toHaveBeenCalled()
  })

  it('preserves old-account history and allows reviewing for the new account', async () => {
    mocks.publications = [
      {
        id: 'old-post',
        propertyId: property.id,
        accountId: 'old-account',
        status: 'PUBLISHED',
        permalink: 'https://www.instagram.com/p/old/',
        errorCode: null,
        createdAt: new Date().toISOString(),
      },
    ]
    render(<PropertyInstagramPanel property={property} />)
    expect(screen.getByRole('link', { name: 'Ver publicação' })).toHaveAttribute(
      'href',
      'https://www.instagram.com/p/old/',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Revisar publicação no Instagram' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Revisar publicação em @my-account')
  })

  it('does not offer another confirmation for an uncertain post in the current account', () => {
    mocks.publications = [
      {
        id: 'uncertain-post',
        propertyId: property.id,
        accountId: 'current-account',
        status: 'VERIFYING',
        permalink: null,
        errorCode: null,
        createdAt: new Date().toISOString(),
      },
    ]
    render(<PropertyInstagramPanel property={property} />)
    expect(
      screen.queryByRole('button', { name: 'Revisar publicação no Instagram' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
  })
})
