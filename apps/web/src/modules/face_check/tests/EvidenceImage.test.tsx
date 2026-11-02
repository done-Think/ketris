import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useTenantSessionScope } from '@shared/hooks/use-tenant-session-scope'

import { EvidenceImage } from '../components/console/detail/EvidenceImage'
import { consoleService } from '../services/console-service'
import { ApiError } from '../services/api-error'

vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  const messages = (await import('@/i18n/messages/pt-BR/face_check.json')).default
  return {
    ...actual,
    useTranslations: (
      namespace: 'face_check.console.detail.evidence' = 'face_check.console.detail.evidence',
    ) =>
      actual.createTranslator({ locale: 'pt-BR', messages: { face_check: messages }, namespace }),
  }
})

vi.mock('@shared/hooks/use-tenant-session-scope', () => ({ useTenantSessionScope: vi.fn() }))
vi.mock('../services/console-service', () => ({ consoleService: { getEvidence: vi.fn() } }))
vi.mock('../components/ui', () => ({ ErrorNotice: () => <span role="alert">Error</span> }))

describe('private evidence image lifecycle', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetAllMocks()
  })

  it('renders a temporary blob URL and revokes it while cancelling on unmount', async () => {
    vi.mocked(useTenantSessionScope).mockReturnValue({
      tenantId: 'tenant',
      userId: 'reviewer',
      role: 'OWNER',
      enabled: true,
      actorKey: ['reviewer', 'OWNER'],
      session: null,
    })
    vi.mocked(consoleService.getEvidence).mockResolvedValue(new Blob(['image']))
    const create = vi.fn(() => 'blob:private-evidence')
    const revoke = vi.fn()
    vi.stubGlobal(
      'URL',
      Object.assign(class extends URL {}, { createObjectURL: create, revokeObjectURL: revoke }),
    )
    const view = render(
      <EvidenceImage sessionId="session" reference="photo" label="Document photo" />,
    )
    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Document photo' })).toHaveAttribute(
        'src',
        'blob:private-evidence',
      ),
    )
    const signal = vi.mocked(consoleService.getEvidence).mock.calls[0][2]
    expect(signal?.aborted).toBe(false)
    view.unmount()
    expect(signal?.aborted).toBe(true)
    expect(revoke).toHaveBeenCalledWith('blob:private-evidence')
  })

  it('does not fetch evidence before the tenant session is ready', () => {
    vi.mocked(useTenantSessionScope).mockReturnValue({
      tenantId: undefined,
      userId: undefined,
      role: undefined,
      enabled: false,
      actorKey: [],
      session: null,
    })
    const view = render(
      <EvidenceImage sessionId="session" reference="photo" label="Document photo" />,
    )
    expect(consoleService.getEvidence).not.toHaveBeenCalled()
    view.unmount()
  })

  it('shows the retention notice if the image was already removed', async () => {
    vi.mocked(useTenantSessionScope).mockReturnValue({
      tenantId: 'tenant',
      userId: 'reviewer',
      role: 'OWNER',
      enabled: true,
      actorKey: ['reviewer', 'OWNER'],
      session: null,
    })
    vi.mocked(consoleService.getEvidence).mockRejectedValue(new ApiError('EVIDENCE_NOT_FOUND', 404))
    const view = render(
      <EvidenceImage sessionId="session" reference="photo" label="Document photo" />,
    )
    expect(await screen.findByText('Imagens excluídas conforme o prazo de retenção')).toBeVisible()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    view.unmount()
  })
})
