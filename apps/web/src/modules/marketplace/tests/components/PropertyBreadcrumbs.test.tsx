import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PropertyBreadcrumbs } from '../../components/PropertyBreadcrumbs'

describe('property breadcrumbs use only the registered location', () => {
  it('does not invent a city when only one location is known', () => {
    render(<PropertyBreadcrumbs location="Itajubá" propertyTitle="Casa em Minas" />)
    expect(screen.getByRole('link', { name: 'Itajubá' })).toBeVisible()
    expect(screen.queryByText('São Paulo')).not.toBeInTheDocument()
  })

  it('shows the real city and neighborhood', () => {
    render(<PropertyBreadcrumbs location="Anhumas, Itajubá" propertyTitle="Casa em Minas" />)
    expect(screen.getByRole('link', { name: 'Anhumas' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Itajubá' })).toBeVisible()
  })

  it('omits empty locations while retaining home and the property', () => {
    render(<PropertyBreadcrumbs location=" , " propertyTitle="Casa em Minas" />)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByText('Casa em Minas')).toHaveAttribute('aria-current', 'page')
  })
})
