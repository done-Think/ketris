import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { CrmShell } from './CrmShell'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

function mockUnauthenticatedSession() {
  vi.mocked(useSession).mockReturnValue({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function renderShell() {
  return render(
    <ThemeProvider theme={theme}>
      <CrmShell>
        <div>Conteúdo da rota</div>
      </CrmShell>
    </ThemeProvider>,
  )
}

describe('CrmShell access rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUnauthenticatedSession()
  })

  it('renders the pipeline without requiring a session', () => {
    vi.mocked(usePathname).mockReturnValue('/crm')

    renderShell()

    expect(screen.getByText('Conteúdo da rota')).toBeVisible()
    expect(screen.queryByText('Acesso restrito ao CRM')).not.toBeInTheDocument()
  })

  it.each(['/crm/contatos', '/crm/propostas', '/crm/oportunidades/opportunity-1'])(
    'keeps %s protected without a session',
    (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname)

      renderShell()

      expect(screen.getByText('Acesso restrito ao CRM')).toBeVisible()
      expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
    },
  )
})
