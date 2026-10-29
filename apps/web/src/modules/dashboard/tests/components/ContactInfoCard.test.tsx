import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ContactInfoCard } from '../../components/ContactInfoCard'
import { renderWithProviders } from '../fixtures/render'

describe('ContactInfoCard', () => {
  it('mostra rótulo, nome e telefone', () => {
    renderWithProviders(<ContactInfoCard label="Cliente" name="Ana" phone="(11) 98888-0000" />)

    expect(screen.getByText('Cliente')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('(11) 98888-0000')).toBeInTheDocument()
  })
})
