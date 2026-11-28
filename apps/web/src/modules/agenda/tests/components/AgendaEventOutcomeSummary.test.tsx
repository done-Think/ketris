import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { AgendaEventOutcomeSummary } from '../../components/AgendaEventOutcomeSummary'
import { AgendaEventStatusChip } from '../../components/AgendaEventStatusChip'
import { agendaEventFixture } from '../fixtures/agenda-event'

it('resume a visita realizada com autor, interesse e anotações', () => {
  render(
    <AgendaEventOutcomeSummary
      event={agendaEventFixture({
        status: 'COMPLETED',
        outcomeRecordedBy: 'Corretor André',
        outcomeRecordedAt: '2026-11-04T14:42:00.000Z',
        visitInterest: 'MEDIUM',
        outcomeNotes: 'Quer proposta.',
      })}
    />,
  )

  expect(screen.getByText('Evento realizado')).toBeVisible()
  expect(screen.getByText(/Registrado por Corretor André em/)).toBeVisible()
  expect(screen.getByText('Médio')).toBeVisible()
  expect(screen.getByText('Quer proposta.')).toBeVisible()
})

it('mostra a ausência do cliente sem campos vazios', () => {
  render(<AgendaEventOutcomeSummary event={agendaEventFixture({ status: 'NO_SHOW' })} />)

  expect(screen.getByText('Cliente não compareceu')).toBeVisible()
  expect(screen.queryByText('Interesse do cliente')).not.toBeInTheDocument()
  expect(screen.queryByText('Anotações')).not.toBeInTheDocument()
})

it('não mostra nada enquanto o evento não tem resultado', () => {
  const { container } = render(<AgendaEventOutcomeSummary event={agendaEventFixture()} />)

  expect(container).toBeEmptyDOMElement()
})

it.each([
  ['CONFIRMED', 'Agendado'],
  ['AWAITING_OUTCOME', 'Aguardando resultado'],
  ['COMPLETED', 'Realizado'],
  ['NO_SHOW', 'Cliente não compareceu'],
] as const)('rotula o status %s como "%s"', (status, label) => {
  render(<AgendaEventStatusChip status={status} />)

  expect(screen.getByText(label)).toBeVisible()
})
