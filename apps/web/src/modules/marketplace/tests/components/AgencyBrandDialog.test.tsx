import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { brand } from '@shared/theme/tokens'
import { theme } from '@shared/theme/theme'

import { AgencyBrandDialog } from '../../components/agency-brand-editor/AgencyBrandDialog'
import type { AgencyProfile } from '../../types/agency'
import type { AgencyBrandFormValues } from '../../types/agency-brand-editor'

vi.mock('../../hooks/use-profile-media', () => ({
  useUploadProfileMedia: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

const initialValues: AgencyBrandFormValues = {
  backgroundColor: '#FFFFFF',
  primaryColor: '#0B6BCB',
  secondaryColor: '',
  logoUrl: '',
  bannerUrl: '',
}

function buildAgency(values: AgencyBrandFormValues): AgencyProfile {
  return {
    id: 'agency-1',
    name: 'Imobiliária Horizonte',
    headline: 'Seu próximo endereço',
    legalCreci: 'CRECI J-12345',
    logoInitials: 'IH',
    bannerUrl: values.bannerUrl || null,
    brand: {
      backgroundColor: values.backgroundColor || null,
      primaryColor: values.primaryColor || null,
      secondaryColor: values.secondaryColor || null,
      logoUrl: values.logoUrl || null,
    },
    headquarters: 'Campinas, SP',
    address: null,
    coverage: [],
    segments: ['Residencial'],
    activeListings: 0,
    brokersCount: 0,
    dealsClosed: 0,
    responseTime: null,
    yearsInMarket: null,
    rating: null,
    phone: null,
    email: null,
    summary: null,
    href: '/agencies/horizonte',
    teamHighlights: [],
    featuredListings: [],
  }
}

const handlers = {
  buildPreview: vi.fn(buildAgency),
  onApply: vi.fn(),
  onClose: vi.fn(),
}

function renderDialog(values: AgencyBrandFormValues = initialValues) {
  return render(
    <ThemeProvider theme={theme}>
      <AgencyBrandDialog open initialValues={values} {...handlers} />
    </ThemeProvider>,
  )
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

beforeEach(() => {
  handlers.buildPreview.mockClear()
  handlers.onApply.mockClear()
  handlers.onClose.mockClear()
})

describe('AgencyBrandDialog', () => {
  it('shows each color with where it appears and an empty color as "Sem cor"', () => {
    renderDialog()

    expect(screen.getByRole('dialog', { name: 'Personalizar marca' })).toBeVisible()
    expect(screen.getByLabelText('Fundo da marca')).toHaveValue('#FFFFFF')
    expect(screen.getByLabelText('Cor dos destaques')).toHaveValue('#0B6BCB')
    expect(screen.getByLabelText('Cor do nome')).toHaveValue('')
    expect(screen.getByLabelText('Cor do nome')).toHaveAttribute('placeholder', 'Sem cor')
    expect(screen.getByText('obrigatório para publicar')).toBeVisible()
    expect(
      screen.getByText('Nome e CRECI no cartão. Se ficar vazia, usa a cor dos destaques.'),
    ).toBeVisible()
    expect(screen.getByText('Logotipo')).toBeVisible()
    expect(screen.getByText('Imagem de capa')).toBeVisible()
    expect(screen.getByText('PNG com fundo transparente, a partir de 400 px.')).toBeVisible()
  })

  it('applies the edited colors without touching the page until Aplicar', async () => {
    const user = userEvent.setup()
    renderDialog()

    const nameColor = screen.getByLabelText('Cor do nome')
    await user.type(nameColor, '#0a2540')
    expect(handlers.onApply).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(handlers.onApply).toHaveBeenCalledWith(
      { ...initialValues, secondaryColor: '#0A2540' },
      expect.anything(),
    )
  })

  it('discards the changes on Cancelar', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Cor do nome'), '#0A2540')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(handlers.onClose).toHaveBeenCalledTimes(1)
    expect(handlers.onApply).not.toHaveBeenCalled()
  })

  it('fills the three colors from a ready-made palette', async () => {
    const user = userEvent.setup()
    renderDialog()

    const ocean = screen.getByRole('button', { name: 'Usar a paleta Oceano' })
    await user.click(ocean)

    expect(screen.getByLabelText('Fundo da marca')).toHaveValue('#EAF4FB')
    expect(screen.getByLabelText('Cor dos destaques')).toHaveValue('#0B6BCB')
    expect(screen.getByLabelText('Cor do nome')).toHaveValue('#0A2540')
    expect(ocean).toHaveAttribute('aria-pressed', 'true')
  })

  it('has no reset button nor hover hint', () => {
    renderDialog()

    expect(screen.queryByRole('button', { name: /padrão Ketris/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Passe o mouse/)).not.toBeInTheDocument()
  })

  it('warns when the name becomes hard to read on the background', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Cor do nome'), '#FFE14D')

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/O nome fica difícil de ler sobre o fundo/)).toBeVisible()
    expect(within(alert).getByText(/mais escura/)).toBeVisible()
  })

  it('blocks Aplicar while a color is not a valid hex code', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText('Cor do nome'), '#12')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(await screen.findByText('Informe uma cor hexadecimal válida')).toBeVisible()
    expect(handlers.onApply).not.toHaveBeenCalled()
  })

  it('updates the color from the native picker', () => {
    renderDialog()

    fireEvent.change(screen.getByLabelText('Escolher Fundo da marca'), {
      target: { value: '#eef6ef' },
    })

    expect(screen.getByLabelText('Fundo da marca')).toHaveValue('#EEF6EF')
  })

  it('highlights in the preview where a color appears while hovering it', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.hover(screen.getByLabelText('Fundo da marca'))

    expect(handlers.buildPreview).toHaveBeenLastCalledWith(
      expect.objectContaining({ backgroundColor: brand.semantic.info }),
    )

    await user.unhover(screen.getByLabelText('Fundo da marca'))

    expect(handlers.buildPreview).toHaveBeenLastCalledWith(
      expect.objectContaining({ backgroundColor: '#FFFFFF' }),
    )
  })
})
