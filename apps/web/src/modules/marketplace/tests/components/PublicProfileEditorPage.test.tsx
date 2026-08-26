import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyPublicProfileEditorPage } from '../../components/AgencyPublicProfileEditorPage'
import { PublicProfileEditorPage } from '../../components/PublicProfileEditorPage'

function renderWithTheme(component: ReactElement) {
  render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
}

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

describe('PublicProfileEditorPage', () => {
  it('renders the broker editor with validated form controls', () => {
    renderWithTheme(<PublicProfileEditorPage />)

    expect(screen.getByRole('heading', { name: 'Editar Perfil' })).toBeVisible()
    expect(screen.getByLabelText('Nome exibido')).toBeVisible()
    expect(screen.getByLabelText('Cor principal')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Visualizar' })).toBeVisible()
  })

  it('renders the agency editor with agency-specific controls', () => {
    renderWithTheme(<AgencyPublicProfileEditorPage />)

    expect(screen.getByRole('heading', { name: 'Editar Perfil da Imobiliária' })).toBeVisible()
    expect(screen.getByLabelText('Nome da imobiliária')).toBeVisible()
    expect(screen.getByLabelText('CRECI')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Salvar rascunho' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Visualizar' })).toBeVisible()
  })
})
