import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { PropertyDetailHeader } from '../../components/PropertyDetailHeader'
import type { DashboardProperty } from '../../types/dashboard-property'

const baseProperty: DashboardProperty = {
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

function renderHeader(overrides: Partial<Parameters<typeof PropertyDetailHeader>[0]> = {}) {
  const onEdit = vi.fn()
  const onPublish = vi.fn()
  const onUnpublish = vi.fn()
  const onDeleteRequest = vi.fn()

  render(
    <ThemeProvider theme={theme}>
      <PropertyDetailHeader
        property={baseProperty}
        canManage
        isPublishing={false}
        isUnpublishing={false}
        isDeleting={false}
        onEdit={onEdit}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onDeleteRequest={onDeleteRequest}
        {...overrides}
      />
    </ThemeProvider>,
  )

  return { onEdit, onPublish, onUnpublish, onDeleteRequest }
}

describe('PropertyDetailHeader', () => {
  it('shows the manage actions and a Publicar button for a draft property when canManage is true', () => {
    renderHeader()

    expect(screen.getByRole('button', { name: /Editar/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /Excluir/ })).toBeVisible()
    expect(screen.getByRole('button', { name: /Publicar/ })).toBeVisible()
  })

  it('shows a Despublicar button instead when the property is published', () => {
    renderHeader({ property: { ...baseProperty, apiStatus: 'PUBLISHED' } })

    expect(screen.getByRole('button', { name: /Despublicar/ })).toBeVisible()
    expect(screen.queryByRole('button', { name: /^Publicar/ })).not.toBeInTheDocument()
  })

  it('hides every manage action when canManage is false', () => {
    renderHeader({ canManage: false })

    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Publicar/ })).not.toBeInTheDocument()
  })

  it('calls onEdit and onDeleteRequest when their buttons are clicked', async () => {
    const { onEdit, onDeleteRequest } = renderHeader()

    await userEvent.click(screen.getByRole('button', { name: /Editar/ }))
    await userEvent.click(screen.getByRole('button', { name: /Excluir/ }))

    expect(onEdit).toHaveBeenCalledOnce()
    expect(onDeleteRequest).toHaveBeenCalledOnce()
  })

  it('calls onPublish for a draft property and onUnpublish for a published one', async () => {
    const { onPublish } = renderHeader()
    await userEvent.click(screen.getByRole('button', { name: /Publicar/ }))
    expect(onPublish).toHaveBeenCalledOnce()

    const { onUnpublish } = renderHeader({ property: { ...baseProperty, apiStatus: 'PUBLISHED' } })
    await userEvent.click(screen.getByRole('button', { name: /Despublicar/ }))
    expect(onUnpublish).toHaveBeenCalledOnce()
  })

  it('disables the publish/unpublish button while a mutation is pending', () => {
    renderHeader({ isPublishing: true })

    expect(screen.getByRole('button', { name: /Publicar/ })).toBeDisabled()
  })
})
