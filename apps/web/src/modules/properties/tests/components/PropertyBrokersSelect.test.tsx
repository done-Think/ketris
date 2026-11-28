import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertyBrokersSelect } from '../../components/PropertyBrokersSelect'
import { createDashboardPropertyDefaultValues } from '../../schemas/create-dashboard-property-schema'
import type { CreateDashboardPropertyFormValues } from '../../types/dashboard-property'

const state = vi.hoisted(() => ({
  role: 'OWNER',
  isError: false,
  isLoading: false,
  brokers: [
    { id: 'a', name: 'Ana' },
    { id: 'b', name: 'Bruno' },
  ],
}))
vi.mock('next-auth/react', () => ({ useSession: () => ({ data: { role: state.role } }) }))
vi.mock('../../hooks/use-property-brokers', () => ({
  usePropertyBrokers: () => ({
    data: state.brokers,
    isError: state.isError,
    isLoading: state.isLoading,
  }),
}))

function Form({
  initial = [],
  save = vi.fn(),
}: {
  initial?: string[]
  save?: (values: CreateDashboardPropertyFormValues) => void
}) {
  const { control, handleSubmit } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: { ...createDashboardPropertyDefaultValues, brokerIds: initial },
  })
  return (
    <form onSubmit={handleSubmit(save)}>
      <PropertyBrokersSelect control={control} />
      <button type="submit">Save</button>
    </form>
  )
}

beforeEach(() => {
  state.role = 'OWNER'
  state.isError = false
  state.isLoading = false
})

describe('PropertyBrokersSelect', () => {
  it('selects multiple brokers, restores the saved selection and removes a single grant', async () => {
    const save = vi.fn()
    render(<Form initial={['a']} save={save} />)
    await userEvent.click(screen.getByRole('combobox', { name: 'Corretores com acesso' }))
    await userEvent.click(screen.getByRole('option', { name: 'Bruno' }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({ brokerIds: ['a', 'b'] }),
        expect.anything(),
      ),
    )
    await userEvent.click(screen.getByRole('combobox', { name: 'Corretores com acesso' }))
    await userEvent.click(screen.getByRole('option', { name: 'Ana' }))
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() =>
      expect(save).toHaveBeenLastCalledWith(
        expect.objectContaining({ brokerIds: ['b'] }),
        expect.anything(),
      ),
    )
  })

  it.each(['AGENT', 'PROPERTY_OWNER', 'RENTER'])('hides access management from %s', (role) => {
    state.role = role
    render(<Form />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('disables the field and reports a directory failure without silently discarding saved grants', () => {
    state.isError = true
    render(<Form initial={['a']} />)
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.getByText('Não foi possível carregar os corretores. Tente novamente.'),
    ).toBeVisible()
  })
})
