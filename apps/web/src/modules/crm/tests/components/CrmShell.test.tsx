import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePathname } from '@/i18n/navigation'
import { theme } from '@shared/theme/theme'

import { CrmShell } from '../../components/CrmShell'

vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')

  return {
    usePathname: vi.fn(),
    Link: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
      function MockLocalizedLink({ href = '', ...props }, ref) {
        return React.createElement('a', { ...props, href, ref })
      },
    ),
  }
})

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

  it.each(['/crm', '/crm/contacts'] as const)(
    'renders %s without requiring a session',
    (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname)

      renderShell()

      expect(screen.getByText('Conteúdo da rota')).toBeVisible()
      expect(screen.queryByText('Acesso restrito ao CRM')).not.toBeInTheDocument()
    },
  )

  it.each(['/crm/proposals', '/crm/opportunities/[id]'] as const)(
    'keeps %s protected without a session',
    (pathname) => {
      vi.mocked(usePathname).mockReturnValue(pathname)

      renderShell()

      expect(screen.getByText('Acesso restrito ao CRM')).toBeVisible()
      expect(screen.queryByText('Conteúdo da rota')).not.toBeInTheDocument()
    },
  )
})
