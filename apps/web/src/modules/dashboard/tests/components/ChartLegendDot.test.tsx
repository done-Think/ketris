import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ChartLegendDot } from '../../components/ChartLegendDot'
import { renderWithProviders } from '../fixtures/render'

describe('ChartLegendDot', () => {
  it('mostra o rótulo da série', () => {
    renderWithProviders(<ChartLegendDot color="#000" label="Receita" />)

    expect(screen.getByText('Receita')).toBeInTheDocument()
  })
})
