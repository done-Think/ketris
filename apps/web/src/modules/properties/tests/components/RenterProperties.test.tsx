import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { notFound } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PropertiesDashboardPage } from '../../components/PropertiesDashboardPage'
import { PropertyDetailDashboardPage } from '../../components/PropertyDetailDashboardPage'
import { dashboardProperties } from '../fixtures/dashboard-properties'
import {
  usePropertyPage as useProperties,
  useProperty,
  usePublishProperty,
  useUnpublishProperty,
  useDeleteProperty,
} from '../../hooks/use-properties'
import type { Property } from '../../types/property'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('next/navigation', async () => ({
  ...(await vi.importActual<typeof import('next/navigation')>('next/navigation')),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND')
  }),
}))
vi.mock('@shared/hooks/use-dashboard-face-check-notifications', () => ({
  useDashboardFaceCheckNotifications: () => [],
}))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))
vi.mock('../../hooks/use-properties', () => ({
  usePropertyPage: vi.fn(),
  useProperty: vi.fn(),
  usePublishProperty: vi.fn(),
  useUnpublishProperty: vi.fn(),
  useDeleteProperty: vi.fn(),
}))

const property: Property = {
  id: 'rental-1',
  tenantId: 'tenant-1',
  responsibleUserId: 'renter-1',
  ownerUserId: null,
  responsibleName: 'Corretor responsável',
  activeContractId: null,
  listing: {
    amenities: [],
    negotiationTerms: null,
    publishAfterReview: false,
    allowWhatsappContact: false,
    featured: false,
  },
  title: 'My rented apartment',
  description: 'Apartment',
  purpose: 'RENT',
  type: 'apartment',
  status: 'RENTED',
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  address: {
    street: 'Linked Street',
    number: '20',
    complement: null,
    neighborhood: 'Center',
    city: 'Test City',
    state: 'SP',
    zipCode: '01000000',
    latitude: null,
    longitude: null,
  },
  media: [
    {
      id: 'photo-1',
      url: '/test-rental.png',
      type: 'photo',
      order: 0,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
  values: { price: 1000, rentalPrice: null, condoFee: 200, propertyTax: 50 },
  characteristics: { bedrooms: 2, bathrooms: 1, parkingSpots: 1, areaSqm: 60 },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useSession).mockReturnValue({
    data: { scope: 'tenant', tenantId: 'tenant-1', role: 'RENTER', user: { id: 'renter-1' } },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
  vi.mocked(useProperties).mockReturnValue({
    data: {
      properties: [property],
      pagination: { page: 1, pageSize: 5, total: 1, totalPages: 1 },
      counts: { DRAFT: 0, PUBLISHED: 0, RENTED: 1, SOLD: 0, INACTIVE: 0 },
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useProperties>)
  vi.mocked(useProperty).mockReturnValue({
    data: property,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useProperty>)
  vi.mocked(usePublishProperty).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof usePublishProperty>)
  vi.mocked(useUnpublishProperty).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUnpublishProperty>)
  vi.mocked(useDeleteProperty).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteProperty>)
})

describe('Renter properties', () => {
  it('shows real linked properties without portfolio management controls', () => {
    render(<PropertiesDashboardPage />)
    expect(
      screen.getByText('Consulte os imóveis vinculados aos seus contratos ativos.'),
    ).toBeVisible()
    expect(screen.getByText('My rented apartment')).toBeVisible()
    expect(screen.queryByRole('button', { name: /Novo Imóvel|Mais ações/ })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Filtrar imóveis por status' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Corretor' })).not.toBeInTheDocument()
  })

  it('explains an empty rental list without asking the renter to create property records', () => {
    vi.mocked(useProperties).mockReturnValue({
      data: {
        properties: [],
        pagination: { page: 1, pageSize: 5, total: 0, totalPages: 0 },
        counts: { DRAFT: 0, PUBLISHED: 0, RENTED: 0, SOLD: 0, INACTIVE: 0 },
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useProperties>)
    render(<PropertiesDashboardPage />)
    expect(screen.getByText('Nenhum imóvel vinculado')).toBeVisible()
    expect(screen.queryByRole('button', { name: /Novo Imóvel/ })).not.toBeInTheDocument()
  })

  it.each(['RENTER', 'PROPERTY_OWNER', 'OWNER', 'AGENT'])(
    'shows loading and errors without fixtures for %s',
    (role) => {
      vi.mocked(useSession).mockReturnValue({
        data: { scope: 'tenant', tenantId: 'tenant-1', role, user: { id: 'user-1' } },
        status: 'authenticated',
        update: vi.fn(),
      } as unknown as ReturnType<typeof useSession>)
      vi.mocked(useProperties).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as unknown as ReturnType<typeof useProperties>)
      const { rerender } = render(<PropertiesDashboardPage />)
      expect(screen.getByRole('progressbar', { name: 'Carregando seus imóveis' })).toBeVisible()
      vi.mocked(useProperties).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
      } as unknown as ReturnType<typeof useProperties>)
      rerender(<PropertiesDashboardPage />)
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar seus imóveis.')
      expect(screen.queryByText(dashboardProperties[0].title)).not.toBeInTheDocument()
    },
  )

  it('allows only data and media tabs and does not fetch administrative contracts', async () => {
    const user = userEvent.setup()
    render(<PropertyDetailDashboardPage propertyId={property.id} />)
    expect(screen.getByText('My rented apartment')).toBeVisible()
    expect(
      screen.getByText('As informações deste imóvel estão disponíveis somente para consulta.'),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', {
        name: /Editar|Inativar|Publicar|Despublicar|Histórico|Valores/,
      }),
    ).not.toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    await user.click(buttons[1])
    expect(document.querySelector('img[src="/test-rental.png"]')).toBeInTheDocument()
  })

  it('does not reveal a fixture when access to that property ID is denied', () => {
    vi.mocked(useProperty).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { isAxiosError: true, response: { status: 404 } },
    } as unknown as ReturnType<typeof useProperty>)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() =>
        render(<PropertyDetailDashboardPage propertyId={dashboardProperties[0].id} />),
      ).toThrow('NOT_FOUND')
      expect(notFound).toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })
  it.each([401, 500, undefined])(
    'shows a retryable error instead of a 404 for status %s',
    async (status) => {
      const refetch = vi.fn()
      vi.mocked(useProperty).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: status ? { isAxiosError: true, response: { status } } : new Error('Network error'),
        refetch,
      } as unknown as ReturnType<typeof useProperty>)
      render(<PropertyDetailDashboardPage propertyId={property.id} />)
      expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o imóvel.')
      expect(notFound).not.toHaveBeenCalled()
      await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
      expect(refetch).toHaveBeenCalledOnce()
    },
  )
})
