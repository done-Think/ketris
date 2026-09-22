import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PropertyRowActions } from '../../components/PropertyRowActions'
import {
  useDeleteProperty,
  usePublishProperty,
  useUnpublishProperty,
} from '../../hooks/use-properties'
import type { DashboardProperty } from '../../types/dashboard-property'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../../hooks/use-properties', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../hooks/use-properties')>()

  return {
    ...original,
    usePublishProperty: vi.fn(),
    useUnpublishProperty: vi.fn(),
    useDeleteProperty: vi.fn(),
  }
})

const property: DashboardProperty = {
  id: 'property-1',
  responsibleUserId: 'user-1',
  apiStatus: 'DRAFT',
  title: 'Apartamento Jardins',
  address: 'Alameda Lorena, 1420',
  location: 'Jardins, São Paulo',
  type: 'Apartamento',
  purpose: 'Aluguel',
  price: 'R$ 6.500/mês',
  status: 'Em análise',
  broker: '',
  updatedAt: 'Há 2 horas',
  imageUrl: '',
  heroImageUrl: '',
  media: [],
  summary: {
    bedrooms: '3',
    bathrooms: '2',
    parkingSpaces: '2',
    area: '95m²',
    condominium: 'R$ 1.200',
    iptu: 'R$ 380/mês',
  },
  pricing: {
    rent: 'R$ 6.500/mês',
    sale: 'Não anunciado',
    condominium: 'R$ 1.200',
    iptu: 'R$ 380/mês',
    administrationFee: 'Não informado',
    securityDeposit: 'Não informado',
    lastAdjustment: 'Não informado',
  },
  participants: [],
  activityHistory: [],
}

function mockSession(papel: 'ADMIN' | 'AGENT' = 'AGENT', userId = 'user-1') {
  vi.mocked(useSession).mockReturnValue({
    data: { papel, user: { id: userId } },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}

function mockMutations(
  overrides: {
    publish?: Record<string, unknown>
    unpublish?: Record<string, unknown>
    remove?: Record<string, unknown>
  } = {},
) {
  vi.mocked(usePublishProperty).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    ...overrides.publish,
  } as unknown as ReturnType<typeof usePublishProperty>)
  vi.mocked(useUnpublishProperty).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    ...overrides.unpublish,
  } as unknown as ReturnType<typeof useUnpublishProperty>)
  vi.mocked(useDeleteProperty).mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    ...overrides.remove,
  } as unknown as ReturnType<typeof useDeleteProperty>)
}

function renderActions(overrides: Partial<DashboardProperty> = {}) {
  const onView = vi.fn()

  render(
    <ThemeProvider theme={theme}>
      <PropertyRowActions property={{ ...property, ...overrides }} onView={onView} />
    </ThemeProvider>,
  )

  return { onView }
}

describe('PropertyRowActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession()
    mockMutations()
  })

  it('always shows the view button and calls onView when clicked', async () => {
    const { onView } = renderActions()

    await userEvent.click(screen.getByRole('button', { name: /Visualizar/ }))
    expect(onView).toHaveBeenCalledOnce()
  })

  it('hides the more-actions menu button when the actor cannot manage the property', () => {
    mockSession('AGENT', 'outro-usuario')
    renderActions()

    expect(screen.queryByRole('button', { name: /Mais ações/ })).not.toBeInTheDocument()
  })

  it('shows Editar, Publicar and Excluir for a draft property when the actor can manage it', async () => {
    renderActions()

    await userEvent.click(screen.getByRole('button', { name: /Mais ações/ }))

    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Publicar' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeVisible()
  })

  it('shows Despublicar instead of Publicar for a published property', async () => {
    renderActions({ apiStatus: 'PUBLISHED' })

    await userEvent.click(screen.getByRole('button', { name: /Mais ações/ }))

    expect(screen.getByRole('menuitem', { name: 'Despublicar' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Publicar' })).not.toBeInTheDocument()
  })

  it('closes the menu without error when Editar is clicked', async () => {
    renderActions()

    await userEvent.click(screen.getByRole('button', { name: /Mais ações/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Editar' }))

    await waitFor(() =>
      expect(screen.queryByRole('menuitem', { name: 'Editar' })).not.toBeInTheDocument(),
    )
  })

  it('publishes a draft property from the menu', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    mockMutations({ publish: { mutateAsync } })
    renderActions()

    await userEvent.click(screen.getByRole('button', { name: /Mais ações/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Publicar' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('property-1'))
  })

  it('unpublishes a published property from the menu', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    mockMutations({ unpublish: { mutateAsync } })
    renderActions({ apiStatus: 'PUBLISHED' })

    await userEvent.click(screen.getByRole('button', { name: /Mais ações/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Despublicar' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('property-1'))
  })

  it('asks for confirmation and deletes the property from the menu', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    mockMutations({ remove: { mutateAsync } })
    renderActions()

    await userEvent.click(screen.getByRole('button', { name: /Mais ações/ }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Excluir' }))

    const confirmDialog = (await screen.findByText('Excluir imóvel')).closest(
      '[role="dialog"]',
    ) as HTMLElement
    await userEvent.click(within(confirmDialog).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith('property-1'))
  })
})
