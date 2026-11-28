import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { expect, it } from 'vitest'

import { AgendaTimeField } from '../../components/AgendaTimeField'
import type { AgendaEventFormValues } from '../../types/agenda-event'

function Form({ time = '09:00' }: { time?: string }) {
  const { control, watch } = useForm<AgendaEventFormValues>({
    defaultValues: { scheduledTime: time },
  })
  return (
    <>
      <AgendaTimeField control={control} />
      <output aria-label="Selecionado">{watch('scheduledTime')}</output>
    </>
  )
}

it('keeps the displayed time read-only and offers only whole and half hours', async () => {
  render(<Form />)
  const input = screen.getByRole('combobox', { name: 'Horário' })
  expect(input).toHaveAttribute('readonly')
  await userEvent.click(input)
  const hours = within(screen.getByRole('menu', { name: 'Horas' }))
  const minutes = within(screen.getByRole('menu', { name: 'Minutos' }))
  expect(hours.getAllByRole('menuitem')).toHaveLength(24)
  expect(minutes.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['00', '30'])
  await userEvent.click(hours.getByRole('menuitem', { name: '14' }))
  await userEvent.click(minutes.getByRole('menuitem', { name: '30' }))
  expect(input).toHaveValue('14:30')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('maps numeric typing to the nearest displayed option instead of accepting free minutes', async () => {
  const user = userEvent.setup()
  render(<Form />)
  await user.click(screen.getByRole('combobox', { name: 'Horário' }))
  await user.keyboard('17')
  expect(screen.getByLabelText('Selecionado')).toHaveTextContent('17:00')
  const minutes = within(screen.getByRole('menu', { name: 'Minutos' }))
  act(() => {
    minutes.getByRole('menuitem', { name: '00' }).focus()
  })
  await user.keyboard('29')
  expect(screen.getByLabelText('Selecionado')).toHaveTextContent('17:30')
  await user.keyboard('{Enter}')
  expect(screen.getByRole('combobox', { name: 'Horário' })).toHaveValue('17:30')
})

it('preserves a legacy time until the user selects a valid replacement', async () => {
  render(<Form time="09:15" />)
  expect(screen.getByRole('combobox', { name: 'Horário' })).toHaveValue('09:15')
  await userEvent.click(screen.getByRole('combobox', { name: 'Horário' }))
  const minutes = within(screen.getByRole('menu', { name: 'Minutos' }))
  expect(minutes.queryByRole('menuitem', { name: '15' })).not.toBeInTheDocument()
  await userEvent.click(minutes.getByRole('menuitem', { name: '30' }))
  expect(screen.getByRole('combobox', { name: 'Horário' })).toHaveValue('09:30')
})
