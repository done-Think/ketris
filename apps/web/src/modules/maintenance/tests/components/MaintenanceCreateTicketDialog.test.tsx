import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MaintenanceCreateTicketDialog } from '../../components/MaintenanceCreateTicketDialog'
import { useMaintenanceOptions } from '../../hooks/use-maintenance'
import { createMaintenanceTicketSchema } from '../../schemas/maintenance-ticket-schema'
import type { MaintenanceCreateTicketFormValues } from '../../types/maintenance'
import {
  maintenanceDraftKey,
  readMaintenanceDraft,
  writeMaintenanceDraft,
} from '../../utils/maintenance-draft'

vi.mock('next-auth/react', () => ({ useSession: vi.fn() }))
vi.mock('../../hooks/use-maintenance', () => ({ useMaintenanceOptions: vi.fn() }))
const session = { tenantId: 'tenant-1', user: { id: 'renter-1' }, role: 'RENTER' }
const options = {
  contracts: [
    {
      id: 'c1',
      code: 'C-1',
      propertyId: 'p1',
      propertyTitle: 'Property',
      agentId: 'agent',
      ownerId: 'owner',
      renterIds: ['renter-1'],
      parties: [],
    },
  ],
  users: [],
}
const key = maintenanceDraftKey(session.tenantId, session.user.id)!
const draft: MaintenanceCreateTicketFormValues = {
  contractId: 'c1',
  propertyId: 'p1',
  category: 'PLUMBING',
  priority: 'normal',
  title: 'Leak',
  description: 'Kitchen leak',
}
function mockSession(userId = 'renter-1') {
  vi.mocked(useSession).mockReturnValue({
    data: { ...session, user: { id: userId } },
    status: 'authenticated',
    update: vi.fn(),
  } as unknown as ReturnType<typeof useSession>)
}
describe('Maintenance local draft and submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockSession()
    vi.mocked(useMaintenanceOptions).mockReturnValue({ data: options } as unknown as ReturnType<
      typeof useMaintenanceOptions
    >)
  })
  it('requires a contract and keeps estimated cost out of schema', () => {
    const schema = createMaintenanceTicketSchema((key) => key)
    expect(schema.safeParse({ ...draft, contractId: '' }).success).toBe(false)
    expect(schema.parse({ ...draft, estimatedCost: '100' })).not.toHaveProperty('estimatedCost')
  })
  it('does not offer scheduling before a provider can be assigned to the created ticket', () => {
    render(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.queryByLabelText('Data e horário do atendimento')).not.toBeInTheDocument()
  })
  it('keeps the contract fixed when a renter edits a ticket', async () => {
    render(
      <MaintenanceCreateTicketDialog
        open
        mode="edit"
        initialValues={draft}
        onClose={vi.fn()}
        onCreate={vi.fn()}
      />,
    )
    expect(await screen.findByLabelText('Contrato / imóvel')).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.getByLabelText('Título do Chamado')).toHaveValue('Leak')
  })
  it('shows only available contract options and derives the property', async () => {
    const user = userEvent.setup()
    render(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={vi.fn()} />)
    await user.click(screen.getByLabelText('Contrato / imóvel', { exact: false }))
    await user.click(await screen.findByRole('option', { name: 'C-1 - Property' }))
    await waitFor(() => expect(readMaintenanceDraft(key)?.contractId).toBe('c1'))
  })
  it('saves locally and recovers after closing and reopening', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const props = { onClose, onCreate: vi.fn() }
    const { rerender } = render(<MaintenanceCreateTicketDialog open {...props} />)
    await user.type(screen.getByLabelText('Título do Chamado', { exact: false }), 'Leak')
    await user.click(screen.getByRole('button', { name: 'Salvar e fechar' }))
    expect(onClose).toHaveBeenCalledOnce()
    rerender(<MaintenanceCreateTicketDialog open={false} {...props} />)
    rerender(<MaintenanceCreateTicketDialog open {...props} />)
    expect(screen.getByLabelText('Título do Chamado', { exact: false })).toHaveValue('Leak')
  })
  it('keeps fields and local draft when submission fails', async () => {
    writeMaintenanceDraft(key, draft)
    const user = userEvent.setup()
    const onCreate = vi.fn().mockResolvedValue(false)
    render(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={onCreate} />)
    await user.click(screen.getByRole('button', { name: 'Criar Chamado' }))
    await waitFor(() => expect(onCreate).toHaveBeenCalled())
    expect(screen.getByLabelText('Título do Chamado', { exact: false })).toHaveValue('Leak')
    expect(readMaintenanceDraft(key)?.title).toBe('Leak')
  })
  it('does not clear while request is pending, then clears all fields and local draft on success', async () => {
    writeMaintenanceDraft(key, draft)
    let complete!: (result: boolean) => void
    const onCreate = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          complete = resolve
        }),
    )
    const user = userEvent.setup()
    render(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={onCreate} />)
    await user.click(screen.getByRole('button', { name: 'Criar Chamado' }))
    await waitFor(() => expect(onCreate).toHaveBeenCalled())
    expect(screen.getByLabelText('Título do Chamado', { exact: false })).toHaveValue('Leak')
    expect(screen.getByRole('button', { name: 'Criar Chamado' })).toBeDisabled()
    await act(async () => complete(true))
    await waitFor(() =>
      expect(screen.getByLabelText('Título do Chamado', { exact: false })).toHaveValue(''),
    )
    expect(localStorage.getItem(key)).toBeNull()
    expect(screen.getByLabelText('Relato do Problema')).toHaveValue('')
  })
  it('discards only after explicit confirmation', async () => {
    writeMaintenanceDraft(key, draft)
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<MaintenanceCreateTicketDialog open onClose={onClose} onCreate={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Descartar rascunho' }))
    expect(readMaintenanceDraft(key)).not.toBeNull()
    await user.click(screen.getAllByRole('button', { name: 'Descartar rascunho' }).at(-1)!)
    expect(localStorage.getItem(key)).toBeNull()
    expect(onClose).toHaveBeenCalledOnce()
  })
  it('never restores another users draft', () => {
    writeMaintenanceDraft(key, draft)
    mockSession('other')
    render(<MaintenanceCreateTicketDialog open onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.getByLabelText('Título do Chamado', { exact: false })).toHaveValue('')
  })
  it('ignores corrupt storage without crashing', () => {
    localStorage.setItem(key, 'bad json')
    expect(readMaintenanceDraft(key)).toBeNull()
    expect(maintenanceDraftKey(undefined, 'user')).toBeNull()
  })
})
