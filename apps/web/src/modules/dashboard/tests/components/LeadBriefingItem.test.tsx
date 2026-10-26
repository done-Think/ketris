import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LeadBriefingItem } from '../../components/LeadBriefingItem'
import { renderWithProviders } from '../fixtures/render'

describe('LeadBriefingItem', () => {
  it('mostra rótulo e valor', () => {
    renderWithProviders(<LeadBriefingItem label="Origem" value="Site" />)

    expect(screen.getByText('Origem')).toBeInTheDocument()
    expect(screen.getByText('Site')).toBeInTheDocument()
  })
})
