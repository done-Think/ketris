import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MaintenanceLinksDialog } from '../../components/MaintenanceLinksDialog'
import { MaintenanceProviderForm } from '../../components/MaintenanceProviderForm'
const mocks = vi.hoisted(() => ({ mutate: vi.fn(), pending: false }))
vi.mock('../../hooks/use-maintenance', () => ({
  useMaintenanceOptions: () => ({
    data: {
      contracts: [{ id: 'contract-1', code: 'C-1', propertyTitle: 'Property', parties: [] }],
      users: [{ id: 'owner-1', name: 'Property owner', role: 'PROPERTY_OWNER' }],
    },
  }),
  useRegularizeMaintenanceLinks: () => ({ mutateAsync: mocks.mutate, isPending: mocks.pending }),
}))

describe('Maintenance forms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pending = false
    mocks.mutate.mockResolvedValue(undefined)
  })
  it('validates a provider and preserves commas and multiline notes', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<MaintenanceProviderForm isPending={false} onClose={vi.fn()} onSubmit={save} />)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(save).not.toHaveBeenCalled()
    await userEvent.type(screen.getByRole('textbox', { name: /Nome/ }), 'João, filho')
    await userEvent.type(
      screen.getByRole('textbox', { name: /Observa/ }),
      'Primeira linha{enter}Segunda, com vírgula',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João, filho',
          notes: 'Primeira linha\nSegunda, com vírgula',
        }),
        expect.anything(),
      ),
    )
  })
  it('keeps regularization selections after a failure and closes only after success', async () => {
    mocks.mutate.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined)
    const close = vi.fn()
    render(<MaintenanceLinksDialog open onClose={close} />)
    await userEvent.click(screen.getByRole('combobox', { name: /Contrato/ }))
    await userEvent.click(await screen.findByRole('option', { name: 'C-1 - Property' }))
    await userEvent.click(screen.getByRole('combobox', { name: /propriet/i }))
    await userEvent.click(await screen.findByRole('option', { name: 'Property owner' }))
    const submit = screen.getByRole('button', { name: /Salvar|Regularizar/ })
    await userEvent.click(submit)
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1))
    expect(close).not.toHaveBeenCalled()
    expect(screen.getByRole('combobox', { name: /propriet/i })).toHaveTextContent('Property owner')
    await userEvent.click(submit)
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    expect(mocks.mutate).toHaveBeenLastCalledWith({
      contractId: 'contract-1',
      ownerId: 'owner-1',
      partyId: undefined,
      renterId: undefined,
    })
  })
})
