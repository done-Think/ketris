import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SnackbarProvider } from 'notistack'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PropertyOverview } from '../../components/property-detail/PropertyOverview'
import {
  publicPropertyDetail as property,
  toMarketplacePropertyDetail as mapped,
} from '../fixtures/public-property-detail'

vi.mock('../../components/PropertyDetailMap', () => ({
  PropertyDetailMap: ({ latitude, longitude }: { latitude: number; longitude: number }) => (
    <div data-testid="property-map">
      {latitude},{longitude}
    </div>
  ),
}))

describe('property location', () => {
  it.each([
    ['RENT', 'alugar', true],
    ['RENT', 'comprar', true],
    ['SALE', 'comprar', false],
    ['SALE', 'alugar', false],
    ['BOTH', 'alugar', true],
    ['BOTH', 'comprar', false],
    ['BOTH', undefined, false],
  ] as const)(
    'shows only matching conditions for %s in the %s context',
    (listingPurpose, context, rental) => {
      render(
        <PropertyOverview
          property={mapped(
            {
              ...property,
              purpose: listingPurpose,
              negotiationConditions: [
                'ACCEPTS_FINANCING',
                'REQUIRES_DOWN_PAYMENT',
                'AGREE_WITH_OWNER',
                'REQUIRES_DEPOSIT',
              ],
              negotiationTerms: 'Contato pelo telefone do anúncio.',
            },
            context,
          )}
        />,
      )

      for (const label of ['Aceita financiamento', 'Exige entrada']) {
        expect(Boolean(screen.queryByText(label))).toBe(!rental)
      }
      for (const label of ['Aluguel a combinar com o proprietário', 'Exige caução']) {
        expect(Boolean(screen.queryByText(label))).toBe(rental)
      }
      expect(screen.getByText('Contato pelo telefone do anúncio.')).toBeVisible()
    },
  )

  it('presents saved negotiation choices and the observation on the public page', () => {
    render(
      <PropertyOverview
        property={mapped({
          ...property,
          negotiationConditions: ['ACCEPTS_FINANCING', 'REQUIRES_DOWN_PAYMENT'],
          negotiationTerms: 'Entrada mínima de R$ 50.000.',
        })}
      />,
    )
    expect(screen.getByRole('region', { name: 'Condições de negociação' })).toBeVisible()
    expect(screen.getByText('Aceita financiamento')).toBeVisible()
    expect(screen.getByText('Exige entrada')).toBeVisible()
    expect(screen.getByText('Entrada mínima de R$ 50.000.')).toBeVisible()
    expect(screen.getByText('Observação')).toBeVisible()
    expect(screen.queryByText('Informação cadastrada anteriormente')).not.toBeInTheDocument()
  })
  it('formats an unmasked stored CEP in the public address', () => {
    const result = mapped({ ...property, address: { ...property.address!, zipCode: '37502330' } })
    expect(result.address).toContain('37502-330')
  })

  it('does not invent São Paulo coordinates when the address has no coordinates', () => {
    const result = mapped()
    expect(result.mapCenter).toBeNull()
    expect(result.address).toContain('Itajubá')
    expect(result.address).toContain('MG')
  })

  it('shows an unavailable message instead of a map with an invented marker', () => {
    render(<PropertyOverview property={mapped()} />)
    expect(screen.queryByTestId('property-map')).not.toBeInTheDocument()
    expect(
      screen.getByText('Localização no mapa ainda não disponível para este endereço.'),
    ).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Buscar endereço no Google Maps' })
    const url = new URL(link.getAttribute('href')!)
    expect(url.origin).toBe('https://www.google.com')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('query')).toContain('Itajubá/MG')
  })

  it('renders the coordinates supplied for the property', () => {
    render(
      <PropertyOverview property={mapped({ ...property, latitude: -22.43, longitude: -45.45 })} />,
    )
    expect(screen.getByTestId('property-map')).toHaveTextContent('-22.43,-45.45')
  })
})

describe('property overview actions', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    [vi.fn().mockResolvedValue(undefined), 'Link copiado.'],
    [
      vi.fn().mockRejectedValue(new Error('denied')),
      'Não foi possível compartilhar. Copie o endereço pelo navegador.',
    ],
  ])(
    'shows favorite and share on every screen and reports the copied link',
    async (writeText, message) => {
      vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
      const user = userEvent.setup()
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
      render(
        <SnackbarProvider domRoot={document.body}>
          <PropertyOverview property={mapped()} />
        </SnackbarProvider>,
      )

      expect(screen.getByRole('button', { name: 'Favoritar' })).toBeVisible()
      await user.click(screen.getByRole('button', { name: 'Compartilhar' }))

      expect(writeText).toHaveBeenCalledWith(window.location.href)
      expect(await screen.findByText(message)).toBeInTheDocument()
    },
  )
})
