import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, useWatch } from 'react-hook-form'
import { beforeEach, expect, it, vi } from 'vitest'
import { AgendaEventFormFields } from '../../components/AgendaEventFormFields'
import type { AgendaEventFormValues } from '../../types/agenda-event'

const query = vi.hoisted(() => ({
  allowCustom: true,
  data: {
    pages: [
      { items: [{ id: 'p1', label: 'Apartamento Jardins' }], page: 1, pageSize: 1, total: 2 },
    ],
  },
  isFetching: false,
  isError: false,
  hasNextPage: true,
  refetch: vi.fn(),
  fetchNextPage: vi.fn(),
}))
vi.mock('../../hooks/use-agenda-properties', () => ({ useAgendaProperties: () => query }))
beforeEach(() => {
  vi.clearAllMocks()
  query.allowCustom = true
  query.isError = false
  query.hasNextPage = true
})
function Fields() {
  const { control } = useForm<AgendaEventFormValues>({
    defaultValues: {
      propertyId: '',
      internal: false,
      audience: 'SHARED_TEAM',
      kind: 'VISIT',
      participant: '',
      phone: '',
      customProperty: '',
      title: '',
      durationMinutes: 30,
      scheduledDate: '2031-03-01',
      scheduledTime: '12:00',
      notes: '',
      responsibleId: '',
      outsideBusinessHoursConfirmed: false,
    },
  })
  const property = useWatch({ control, name: 'propertyId' })
  return (
    <>
      <AgendaEventFormFields
        control={control}
        propertyOptions={[]}
        minDate="2031-03-01"
        maxDate="2031-09-01"
      />
      <output>{property}</output>
    </>
  )
}
it('vincula a escolha paginada ao formulário e oferece mais resultados', async () => {
  render(<Fields />)
  await userEvent.click(screen.getByRole('combobox', { name: 'Imóvel em questão' }))
  await userEvent.click(screen.getByRole('option', { name: 'Apartamento Jardins' }))
  expect(screen.getByText('p1')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Carregar mais imóveis' }))
  expect(query.fetchNextPage).toHaveBeenCalledOnce()
  expect(screen.getByLabelText('Duração')).toHaveAttribute('min', '30')
})
it('não oferece referência livre ao locatário e permite repetir uma busca com erro', async () => {
  query.allowCustom = false
  query.isError = true
  render(<Fields />)
  await userEvent.click(screen.getByRole('combobox', { name: 'Imóvel em questão' }))
  expect(screen.queryByRole('option', { name: 'Outro' })).not.toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
  expect(query.refetch).toHaveBeenCalledOnce()
})
