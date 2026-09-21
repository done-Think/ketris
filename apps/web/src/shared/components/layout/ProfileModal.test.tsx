import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ProfileModal } from './ProfileModal'

// LanguageSelector usa next/navigation direto (não o wrapper @/i18n/navigation, já mockado
// globalmente em src/test/setup.ts) — sem isso, usePathname() retorna null em jsdom e quebra.
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}))

function renderModal(role?: 'ADMIN' | 'OWNER' | 'AGENT' | 'RENTER') {
  const anchorRef = createRef<HTMLButtonElement>()

  return render(
    <ProfileModal
      open
      anchorRef={anchorRef}
      userProfile={{ name: 'Ana Silva', email: 'ana@ketris.dev', role }}
      actions={[]}
      onClose={vi.fn()}
    />,
  )
}

describe('ProfileModal', () => {
  it('mostra o papel do usuário logado (AGENT)', () => {
    renderModal('AGENT')

    expect(screen.getByText('Corretor parceiro')).toBeInTheDocument()
  })

  it('mostra o papel correto para cada tipo de conta (não fica fixo em "Corretor parceiro")', () => {
    const { rerender } = renderModal('RENTER')
    expect(screen.getByText('Locatário')).toBeInTheDocument()

    rerender(
      <ProfileModal
        open
        anchorRef={createRef<HTMLButtonElement>()}
        userProfile={{ name: 'Ana Silva', email: 'ana@ketris.dev', role: 'OWNER' }}
        actions={[]}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('Proprietário')).toBeInTheDocument()
    expect(screen.queryByText('Corretor parceiro')).not.toBeInTheDocument()
  })

  it('não quebra quando o papel não é informado', () => {
    renderModal(undefined)

    expect(screen.getByText('Ana Silva')).toBeInTheDocument()
  })
})
