vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { AgendaDashboardHeader } from '../../components/agenda-dashboard/AgendaDashboardHeader'

it('respeita os limites de navegação e permite abrir um novo evento', async () => {
  const onNewEvent = vi.fn(),
    onNextWeek = vi.fn(),
    onPreviousWeek = vi.fn()
  render(
    <AgendaDashboardHeader
      disableNextWeek={false}
      disablePreviousWeek
      notifications={[]}
      onNewEvent={onNewEvent}
      onNextWeek={onNextWeek}
      onPreviousWeek={onPreviousWeek}
      onNotificationSelect={vi.fn()}
      weekRange={{ startLabel: '01', endLabel: '05 Mar' }}
    />,
  )
  const previous = screen.getAllByRole('button', { name: /anterior/i })
  expect(previous.every((button) => button.hasAttribute('disabled'))).toBe(true)
  await userEvent.click(screen.getAllByRole('button', { name: 'Novo Evento' })[0])
  await userEvent.click(screen.getAllByRole('button', { name: /próxim/i })[0])
  expect(onNewEvent).toHaveBeenCalledOnce()
  expect(onNextWeek).toHaveBeenCalledOnce()
  expect(onPreviousWeek).not.toHaveBeenCalled()
})
