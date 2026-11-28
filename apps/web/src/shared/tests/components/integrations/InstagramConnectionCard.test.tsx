import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { InstagramConnectionCard } from '@shared/components/integrations/InstagramConnectionCard'

const mocks = vi.hoisted(() => ({
  role: 'OWNER',
  connection: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { role: mocks.role, tenantId: 'tenant-a' } }),
}))
vi.mock('@shared/hooks/use-instagram', () => ({
  useInstagramConnection: mocks.connection,
  useDisconnectInstagram: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

beforeEach(() => {
  mocks.role = 'OWNER'
  mocks.connection.mockReset().mockReturnValue({
    data: { configured: true, connected: false },
  })
})

describe('Instagram connection role', () => {
  it.each(['OWNER', 'AGENT', 'PROPERTY_OWNER'])(
    'lets %s access their personal connection controls',
    (role) => {
      mocks.role = role
      render(<InstagramConnectionCard />)
      expect(screen.getByRole('button', { name: 'Conectar Instagram' })).toBeEnabled()
      expect(mocks.connection).toHaveBeenCalled()
    },
  )

  it.each(['ADMIN', 'RENTER'])(
    'hides the controls and does not read connection data for %s',
    (role) => {
      mocks.role = role
      const { container } = render(<InstagramConnectionCard />)
      expect(container).toBeEmptyDOMElement()
      expect(mocks.connection).not.toHaveBeenCalled()
    },
  )
})
