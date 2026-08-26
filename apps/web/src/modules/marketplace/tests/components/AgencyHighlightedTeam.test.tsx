import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyHighlightedTeam } from '../../components/profile/AgencyHighlightedTeam'
import { agencies } from '../../data/agencies'
import { getBrokersByNames } from '../../data/brokers'

const agency = agencies[0]

function renderAgencyHighlightedTeam() {
  render(
    <ThemeProvider theme={theme}>
      <AgencyHighlightedTeam
        brand={agency.brand}
        brokers={getBrokersByNames(agency.teamHighlights)}
      />
    </ThemeProvider>,
  )
}

describe('AgencyHighlightedTeam', () => {
  it('links every highlighted broker to the public broker profile', () => {
    renderAgencyHighlightedTeam()

    expect(screen.getByRole('link', { name: 'Ver perfil de Marina Costa' })).toHaveAttribute(
      'href',
      '/corretores/marina-costa',
    )
    expect(screen.getByRole('link', { name: 'Ver perfil de Juliana Mendes' })).toHaveAttribute(
      'href',
      '/corretores/juliana-mendes',
    )
    expect(screen.getByRole('link', { name: 'Ver perfil de Bianca Azevedo' })).toHaveAttribute(
      'href',
      '/corretores/bianca-azevedo',
    )
  })
})
