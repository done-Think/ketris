import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import { MyVerificationsPage } from '../components/candidate/MyVerificationsPage'
import { useCandidateVerifications } from '../hooks/use-candidate-verifications'
import { ApiError } from '../services/api-error'
import type { CandidateVerification } from '../types/candidate.types'

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({ useTenantSessionScope: vi.fn() }))
vi.mock('../hooks/use-candidate-verifications', () => ({ useCandidateVerifications: vi.fn() }))

function invitation(overrides: Partial<CandidateVerification> = {}): CandidateVerification {
  return {
    id: 'invitation',
    propertyTitle: 'Private apartment',
    agencyName: 'Private agency',
    status: 'CREATED',
    createdAt: '2026-11-01T12:00:00Z',
    expiresAt: '2026-11-08T12:00:00Z',
    captureUrl: '/pt/face_check/verify/private-token',
    ...overrides,
  }
}

function mockList(items: CandidateVerification[]) {
  vi.mocked(useCandidateVerifications, { partial: true }).mockReturnValue({
    data: { items },
    isPending: false,
    error: null,
  })
}

describe('candidate verification requests', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(useTenantSessionScope).mockReturnValue({
      tenantId: 'tenant',
      userId: 'candidate',
      role: 'RENTER',
      enabled: true,
      actorKey: ['candidate', 'RENTER'],
      session: null,
    })
  })

  it.each([
    ['CREATED', 'Enviar documentação'],
    ['IN_PROGRESS', 'Continuar verificação'],
    ['RESUBMISSION_REQUESTED', 'Continuar verificação'],
  ] as const)('provides the invitation action for %s', (status, label) => {
    const item = invitation({ status })
    mockList([item])
    const view = render(<MyVerificationsPage />)
    expect(screen.getByRole('heading', { name: item.propertyTitle })).toBeVisible()
    expect(screen.getByText('Solicitado por Private agency')).toBeVisible()
    expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', item.captureUrl)
    expect(screen.getByText(/Convite válido até/)).toBeVisible()
    expect(view.container.querySelector('[data-face-check-private="true"]')).toHaveClass(
      'sentry-block',
    )
  })

  it('lists separate properties and lets the candidate follow an ongoing analysis', () => {
    mockList([
      invitation(),
      invitation({
        id: 'processing',
        propertyTitle: 'Second property',
        status: 'PROCESSING',
        captureUrl: null,
      }),
    ])
    render(<MyVerificationsPage />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByRole('link', { name: 'Enviar documentação' })).toHaveAttribute(
      'href',
      '/pt/face_check/verify/private-token',
    )
    expect(
      within(cards[1]).getByText(
        'Sua verificação está sendo analisada. Você pode acompanhar o andamento.',
      ),
    ).toBeVisible()
    expect(within(cards[1]).queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows an expired invitation without a capture action or URL', () => {
    mockList([invitation({ status: 'EXPIRED', captureUrl: null })])
    render(<MyVerificationsPage />)
    expect(
      screen.getByText('Este convite expirou. Peça ao responsável pelo imóvel um novo convite.'),
    ).toBeVisible()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows the empty state when no request is linked to this account', () => {
    mockList([])
    render(<MyVerificationsPage />)
    expect(
      screen.getByText(
        'Você não tem verificações vinculadas a esta conta. Use o mesmo e-mail informado ao responsável pelo imóvel ou abra o convite recebido.',
      ),
    ).toBeVisible()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it.each([401, 403, 404])(
    'hides cached property data and capture URLs after access is denied (%s)',
    (status) => {
      const item = invitation()
      mockList([item])
      const view = render(<MyVerificationsPage />)
      expect(screen.getByRole('link', { name: 'Enviar documentação' })).toBeVisible()
      vi.mocked(useCandidateVerifications, { partial: true }).mockReturnValue({
        data: { items: [item] },
        isPending: false,
        error: new ApiError('SESSION_NOT_FOUND', status),
      })
      view.rerender(<MyVerificationsPage />)
      expect(screen.queryByText(item.propertyTitle)).not.toBeInTheDocument()
      expect(screen.queryByText('Solicitado por Private agency')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(view.container.innerHTML).not.toContain('private-token')
      expect(screen.getByRole('alert')).toBeVisible()
    },
  )
})
