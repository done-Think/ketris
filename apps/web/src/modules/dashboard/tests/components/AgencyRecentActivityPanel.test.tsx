import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AgencyRecentActivityPanel } from '../../components/AgencyRecentActivityPanel'
import { agencyActivity } from '../fixtures/dashboard'
import { renderWithProviders } from '../fixtures/render'

describe('AgencyRecentActivityPanel', () => {
  it('monta a frase com e sem corretor', () => {
    renderWithProviders(
      <AgencyRecentActivityPanel
        activities={[
          agencyActivity,
          { ...agencyActivity, id: 'activity-2', broker: '', tone: 'contract' },
        ]}
      />,
    )

    expect(screen.getByText('Bruna recebeu o lead Carlos')).toBeInTheDocument()
    expect(screen.getByText('Contrato ativado para Carlos')).toBeInTheDocument()
  })

  it('abre o detalhe da atividade', async () => {
    renderWithProviders(<AgencyRecentActivityPanel activities={[agencyActivity]} />)

    await userEvent.click(screen.getByText('Bruna recebeu o lead Carlos'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Detalhe da atividade')).toBeInTheDocument()
    expect(within(dialog).getByText('Corretor')).toBeInTheDocument()
    expect(within(dialog).getByText('Lead')).toBeInTheDocument()
  })
})
