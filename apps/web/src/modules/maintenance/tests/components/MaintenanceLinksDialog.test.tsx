import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MaintenanceLinksDialog } from '../../components/MaintenanceLinksDialog'
import { useRegularizeMaintenanceLinks, useMaintenanceOptions } from '../../hooks/use-maintenance'

const mutateAsync = vi.fn()
const enqueueSnackbar = vi.fn()

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))
vi.mock('../../hooks/use-maintenance', () => ({
  useRegularizeMaintenanceLinks: vi.fn(),
  useMaintenanceOptions: vi.fn(),
}))

const options = {
  contracts: [
    {
      id: 'c1',
      code: 'C-1',
      propertyId: 'p1',
      propertyTitle: 'Apto Centro',
      agentId: 'agent',
      ownerId: null,
      renterIds: [],
      parties: [{ id: 'party-1', name: 'Locatário Silva', role: 'LOCATARIO' }],
    },
  ],
  users: [
    { id: 'owner-1', name: 'Dona Maria', role: 'PROPERTY_OWNER' },
    { id: 'renter-1', name: 'João Locatário', role: 'RENTER' },
  ],
}

function renderDialog(onClose = vi.fn()) {
  render(<MaintenanceLinksDialog open onClose={onClose} />)
  return { onClose, user: userEvent.setup() }
}

async function choose(user: ReturnType<typeof userEvent.setup>, label: RegExp, option: string) {
  await user.click(screen.getByLabelText(label))
  await user.click(await screen.findByRole('option', { name: option }))
}

describe('MaintenanceLinksDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useMaintenanceOptions).mockReturnValue({
      data: options,
    } as unknown as ReturnType<typeof useMaintenanceOptions>)
    vi.mocked(useRegularizeMaintenanceLinks).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useRegularizeMaintenanceLinks>)
  })

  it('keeps saving disabled until there is a contract and something to link', async () => {
    const { user } = renderDialog()
    const save = screen.getByRole('button', { name: 'Salvar vínculos' })
    expect(save).toBeDisabled()

    await choose(user, /Contrato/, 'C-1 - Apto Centro')
    expect(save).toBeDisabled()

    await choose(user, /Parte locatária/, 'Locatário Silva')
    expect(save).toBeDisabled()

    await choose(user, /Usuário inquilino/, 'João Locatário')
    await waitFor(() => expect(save).toBeEnabled())
  })

  it('sends only the chosen links and closes on success', async () => {
    mutateAsync.mockResolvedValue(undefined)
    const { user, onClose } = renderDialog()

    await choose(user, /Contrato/, 'C-1 - Apto Centro')
    await choose(user, /Usuário proprietário/, 'Dona Maria')
    await user.click(screen.getByRole('button', { name: 'Salvar vínculos' }))

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        contractId: 'c1',
        ownerId: 'owner-1',
        partyId: undefined,
        renterId: undefined,
      }),
    )
    expect(onClose).toHaveBeenCalled()
  })
})
