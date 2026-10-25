import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { AgendaEventCard } from '../../components/agenda-dashboard/AgendaEventCard'
import { agendaEventFixture } from '../fixtures/agenda-event'

it('abre o evento original por um controle com nome acessível', async () => {
  const event = agendaEventFixture({
    title: 'Visita ao apartamento',
    participant: 'Ana',
    property: 'Jardins',
  })
  const onSelect = vi.fn()
  render(<AgendaEventCard event={event} height={62} top={0} onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: 'Abrir Visita ao apartamento' }))
  expect(onSelect).toHaveBeenCalledOnce()
  expect(onSelect).toHaveBeenCalledWith(event)
  expect(screen.getByText('Ana - Jardins')).toBeVisible()
})
