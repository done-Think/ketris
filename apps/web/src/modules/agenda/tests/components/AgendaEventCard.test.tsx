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
  render(<AgendaEventCard event={event} onSelect={onSelect} />)
  await userEvent.click(screen.getByRole('button', { name: 'Abrir Visita ao apartamento' }))
  expect(onSelect).toHaveBeenCalledOnce()
  expect(onSelect).toHaveBeenCalledWith(event)
  expect(screen.getByText('Ana - Jardins')).toBeVisible()
  expect(screen.getByText('12:00 – 13:00')).toBeVisible()
})

it('mostra no nome acessível o resultado registrado', () => {
  render(
    <AgendaEventCard
      event={agendaEventFixture({ title: 'Visita', status: 'COMPLETED', tone: 'success' })}
      onSelect={vi.fn()}
    />,
  )

  expect(screen.getByRole('button', { name: 'Abrir Visita (Realizado)' })).toBeVisible()
})

it('destaca evento que já terminou sem resultado registrado', () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2031-03-01T13:00:00'))
  render(
    <AgendaEventCard
      event={agendaEventFixture({ title: 'Visita', scheduledDate: '2031-03-01', time: '11:00' })}
      onSelect={vi.fn()}
    />,
  )
  vi.useRealTimers()

  expect(screen.getByRole('button', { name: 'Abrir Visita (Aguardando resultado)' })).toBeVisible()
})
