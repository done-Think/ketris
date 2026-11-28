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

    expect(screen.getByText('qua., 21/10, 10:00')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Visita ao apartamento Batel/ }))

    expect(onActivitySelect).toHaveBeenCalledWith(upcomingActivity)
  })

  it('mostra o dia junto da hora quando as atividades são de dias diferentes', () => {
    renderWithProviders(
      <UpcomingActivitiesPanel
        activities={[
          { ...upcomingActivity, id: 'today', startsAt: '2026-11-27T17:00:00.000Z' },
          { ...upcomingActivity, id: 'tomorrow', startsAt: '2026-11-28T11:00:00.000Z' },
        ]}
        onActivitySelect={vi.fn()}
      />,
    )

    expect(screen.getByText('sex., 27/11, 14:00')).toBeInTheDocument()
    expect(screen.getByText('sáb., 28/11, 08:00')).toBeInTheDocument()
  })
})
