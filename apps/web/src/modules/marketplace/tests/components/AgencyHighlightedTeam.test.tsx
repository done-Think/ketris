import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { theme } from '@shared/theme/theme'

import { AgencyHighlightedTeam } from '../../components/profile/AgencyHighlightedTeam'
import type { AgencyTeamHighlight } from '../../types/agency'

const brand = { primaryColor: '#F30274', secondaryColor: '#212631', backgroundColor: '#FFFFFF' }
const team: AgencyTeamHighlight[] = [
  { usuarioId: 'marina-costa', name: 'Marina Costa', avatarUrl: null },
  { usuarioId: 'juliana-mendes', name: 'Juliana Mendes', avatarUrl: null },
  { usuarioId: 'bianca-azevedo', name: 'Bianca Azevedo', avatarUrl: null },
]

function renderAgencyHighlightedTeam() {
  render(
    <ThemeProvider theme={theme}>
      <AgencyHighlightedTeam brand={brand} team={team} />
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
