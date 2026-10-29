import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { UpcomingActivitiesPanel } from '../../components/UpcomingActivitiesPanel'
import { upcomingActivity } from '../fixtures/dashboard'
import { renderWithProviders } from '../fixtures/render'

describe('UpcomingActivitiesPanel', () => {
  it('mostra a mensagem de vazio', () => {
    renderWithProviders(<UpcomingActivitiesPanel activities={[]} onActivitySelect={vi.fn()} />)

    expect(screen.getByText('Nenhuma atividade agendada.')).toBeInTheDocument()
  })

  it('lista as atividades e avisa qual foi escolhida', async () => {
    const onActivitySelect = vi.fn()
    renderWithProviders(
      <UpcomingActivitiesPanel
        activities={[upcomingActivity]}
        onActivitySelect={onActivitySelect}
      />,
    )

    expect(screen.getByText('10:00')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Visita ao apartamento Batel/ }))

    expect(onActivitySelect).toHaveBeenCalledWith(upcomingActivity)
  })
})
