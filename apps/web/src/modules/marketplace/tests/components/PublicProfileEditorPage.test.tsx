import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyPublicProfileEditorPage } from '../../components/AgencyPublicProfileEditorPage'
import { PublicProfileEditorPage } from '../../components/PublicProfileEditorPage'

vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))

vi.mock('../../hooks/use-broker-profile', () => ({
  useOwnBrokerProfile: () => ({ data: null }),
  useSaveBrokerProfile: () => ({ mutate: vi.fn(), isPending: false }),
  usePublishBrokerProfile: () => ({ mutate: vi.fn(), isPending: false }),
  useUnpublishBrokerProfile: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('../../hooks/use-agency-profile', () => ({
  useOwnAgencyProfile: () => ({ data: null }),
  useSaveAgencyProfile: () => ({ mutate: vi.fn(), isPending: false }),
  usePublishAgencyProfile: () => ({ mutate: vi.fn(), isPending: false }),
  useUnpublishAgencyProfile: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('../../hooks/use-tenant-agents', () => ({
  useTenantAgents: () => ({ data: [] }),
}))

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
    expect(screen.getByLabelText('CRECI')).toBeVisible()
    expect(screen.queryByText('Demonstrativo')).not.toBeInTheDocument()
    expect(screen.queryByText('Ordem do perfil')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).not.toBeInTheDocument()
    // Sem perfil salvo ainda (mock retorna null) — publicar/despublicar não aparece.
    expect(screen.queryByRole('button', { name: 'Publicar' })).not.toBeInTheDocument()

    const previewButton = screen.getByRole('button', { name: 'Visualizar' })
    const saveButton = screen.getByRole('button', { name: 'Salvar' })

    expect(previewButton).toBeVisible()
    expect(saveButton).toBeVisible()
    expect(previewButton.compareDocumentPosition(saveButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('renders the agency editor with agency-specific controls', () => {
    renderWithTheme(<AgencyPublicProfileEditorPage />)

    expect(screen.getByRole('heading', { name: 'Editar Perfil da Imobiliária' })).toBeVisible()
    expect(screen.getByLabelText('Nome da imobiliária')).toBeVisible()
    expect(screen.getByLabelText('CRECI')).toBeVisible()
    expect(screen.getByLabelText('Corretores em destaque')).toBeVisible()
    expect(screen.queryByText('Demonstrativo')).not.toBeInTheDocument()
    expect(screen.queryByText('Ordem do perfil')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar rascunho' })).not.toBeInTheDocument()

    const previewButton = screen.getByRole('button', { name: 'Visualizar' })
    const saveButton = screen.getByRole('button', { name: 'Salvar' })

    expect(previewButton).toBeVisible()
    expect(saveButton).toBeVisible()
    expect(previewButton.compareDocumentPosition(saveButton)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
