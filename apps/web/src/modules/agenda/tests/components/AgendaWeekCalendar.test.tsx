import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { expect, it, vi } from 'vitest'

import { AgendaWeekCalendar } from '../../components/agenda-dashboard/AgendaWeekCalendar'
import { buildAgendaCalendarDays } from '../../components/agenda-dashboard/agenda-dashboard-shared'
import { agendaTimeSlots } from '../../data/agenda-events'
import type { AgendaOrganizationItem } from '../../types/agenda-organization'
import type { AgendaEvent } from '../../types/agenda-event'

it('uses the original hourly grid and keeps due dates separate from service times', async () => {
  const days = buildAgendaCalendarDays(dayjs(), 'pt-BR')
  const items: AgendaOrganizationItem[] = [
    {
      id: 'charge-1',
      sourceId: 'charge-1',
      kind: 'charge',
      date: days[0].key,
      title: 'Rent',
      property: 'Apartment',
      status: 'PENDENTE',
      amount: 1000,
    },
    {
      id: 'opened-1',
      sourceId: 'ticket-1',
      kind: 'ticketOpened',
      date: days[0].key,
      time: '06:30',
      title: 'Leak',
      property: 'Apartment',
      status: 'ABERTO',
    },
    {
      id: 'scheduled-1',
      sourceId: 'ticket-1',
      kind: 'ticketScheduled',
      date: days[1].key,
      time: '20:00',
      title: 'Leak',
      property: 'Apartment',
      status: 'ABERTO',
    },
  ]
  render(
    <AgendaWeekCalendar
      days={days}
      events={[]}
      organizationItems={items}
      timeSlots={agendaTimeSlots}
      onSelectEvent={vi.fn()}
    />,
  )
  const desktop = within(screen.getByRole('region', { name: 'Agenda' }))
  expect(desktop.getByText('08:00')).toBeVisible()
  expect(desktop.getByText('18:00')).toBeVisible()
  expect(desktop.getByText('06:00')).toBeVisible()
  expect(desktop.getByText('20:00')).toBeVisible()
  expect(desktop.getByRole('link', { name: /Rent/ })).toHaveTextContent('Dia todo')
  const ticketLinks = desktop.getAllByRole('link', { name: /Leak/ })
  expect(ticketLinks[0]).toHaveTextContent('06:30')
  expect(ticketLinks[1]).toHaveTextContent('20:00')
  expect(ticketLinks[0]).toHaveAttribute('href', '/dashboard/maintenance/ticket-1')
  expect(ticketLinks[1]).toHaveAttribute('href', '/dashboard/maintenance/ticket-1')
  await userEvent.click(
    screen.getByRole('button', {
      name: `${days[1].dayLabel}, ${days[1].dateLabel} ${days[1].monthLabel}`,
    }),
  )
  expect(screen.getAllByRole('link', { name: /Abertura do chamado/ })).toHaveLength(1)
  expect(screen.getAllByRole('link', { name: /Atendimento agendado/ })).toHaveLength(2)
})

it('keeps overlapping cards separately focusable and opens the correct record', async () => {
  const days = buildAgendaCalendarDays(dayjs(), 'pt-BR')
  const base: AgendaEvent = {
    id: 'one',
    scheduledDate: days[0].key,
    time: '12:00',
    durationMinutes: 60,
    title: 'First event',
    property: 'Apartment',
    propertyHref: '',
    propertyId: null,
    apiKind: 'MEETING',
    participant: 'Client',
    phone: '',
    notes: '',
    status: 'Confirmada',
    tone: 'primary',
  }
  const other = { ...base, id: 'two', title: 'Second event' }
  const onSelect = vi.fn()
  render(
    <AgendaWeekCalendar
      days={days}
      events={[base, other]}
      timeSlots={agendaTimeSlots}
      onSelectEvent={onSelect}
    />,
  )
  const calendar = within(screen.getByRole('region', { name: 'Agenda' }))
  const first = calendar.getByRole('button', { name: 'Abrir First event' })
  const second = calendar.getByRole('button', { name: 'Abrir Second event' })
  expect(getComputedStyle(first).zIndex).not.toBe(getComputedStyle(second).zIndex)
  await userEvent.click(first)
  expect(onSelect).toHaveBeenLastCalledWith(base)
  second.focus()
  expect(second).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  expect(onSelect).toHaveBeenLastCalledWith(other)
})

it('opens the original booking when selecting its continuation after midnight', async () => {
  const days = buildAgendaCalendarDays(dayjs(), 'pt-BR')
  const event: AgendaEvent = {
    id: 'night',
    scheduledDate: days[0].key,
    time: '23:30',
    durationMinutes: 90,
    title: 'Night meeting',
    property: '',
    propertyHref: '',
    propertyId: null,
    apiKind: 'MEETING',
    participant: '',
    phone: '',
    notes: '',
    status: 'Confirmada',
    tone: 'info',
  }
  const onSelect = vi.fn()
  render(
    <AgendaWeekCalendar
      days={days}
      events={[event]}
      timeSlots={agendaTimeSlots}
      onSelectEvent={onSelect}
    />,
  )
  const calendar = within(screen.getByRole('region', { name: 'Agenda' }))
  expect(calendar.getByText('00:00')).toBeVisible()
  expect(calendar.getByText('23:00')).toBeVisible()
  const segments = calendar.getAllByRole('button', { name: 'Abrir Night meeting' })
  expect(segments).toHaveLength(2)
  await userEvent.click(segments[1])
  expect(onSelect).toHaveBeenCalledWith(event)
})

it('keeps the whole booked duration out of the mobile free-slot suggestion', () => {
  const days = buildAgendaCalendarDays(dayjs(), 'pt-BR')
  const event: AgendaEvent = {
    id: 'long',
    scheduledDate: days[0].key,
    time: '08:30',
    durationMinutes: 150,
    title: 'Long meeting',
    property: '',
    propertyHref: '',
    propertyId: null,
    apiKind: 'MEETING',
    participant: '',
    phone: '',
    notes: '',
    status: 'Confirmada',
    tone: 'info',
  }
  render(
    <AgendaWeekCalendar
      days={days}
      events={[event]}
      timeSlots={agendaTimeSlots}
      onSelectEvent={vi.fn()}
    />,
  )
  expect(screen.getByText('Horário livre').parentElement).toHaveTextContent('11:00')
})
