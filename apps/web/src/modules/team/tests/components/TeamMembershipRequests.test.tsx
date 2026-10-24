import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { TeamMembershipRequests } from '../../components/TeamMembershipRequests'

const enqueueSnackbar = vi.fn()
const approve = vi.fn()
const usersQuery = vi.hoisted(() => ({
  current: { data: undefined as unknown, isError: false },
}))
const useUsers = vi.fn((enabled: boolean) => (enabled ? usersQuery.current : { data: undefined }))

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))
vi.mock('@modules/auth/hooks/use-users', () => ({
  useUsers: (enabled: boolean) => useUsers(enabled),
}))
vi.mock('@modules/auth/hooks/use-approve-user-membership', () => ({
  useApproveUserMembership: () => ({ mutateAsync: approve, isPending: false }),
}))

const pendingAgent = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  name: 'Bruna Corretora',
  email: 'bruna@ketris.dev',
  role: 'AGENT',
  active: true,
  pendingApproval: true,
}

function renderRequests(enabled = true) {
  return render(
    <ThemeProvider theme={theme}>
      <TeamMembershipRequests enabled={enabled} />
    </ThemeProvider>,
  )
}

describe('TeamMembershipRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usersQuery.current = {
      data: [pendingAgent, { ...pendingAgent, id: 'agent-2', pendingApproval: false }],
      isError: false,
    }
  })

  it('lista só quem aguarda aprovação e aprova o vínculo', async () => {
    approve.mockResolvedValue(pendingAgent)
    renderRequests()

    expect(screen.getByRole('region', { name: 'Pedidos de vínculo' })).toBeVisible()
    expect(screen.getAllByText('Bruna Corretora')).toHaveLength(1)
    expect(screen.getByText('Corretor parceiro')).toBeVisible()
    expect(screen.getByText('Aguardando aprovação')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Aprovar vínculo de Bruna Corretora' }))

    await waitFor(() => expect(approve).toHaveBeenCalledWith('agent-1'))
    expect(enqueueSnackbar).toHaveBeenCalledWith('Bruna Corretora agora faz parte da equipe.', {
      variant: 'success',
    })
  })

  it('não busca nem mostra nada para quem não é o dono da imobiliária', () => {
    const { container } = renderRequests(false)

    expect(useUsers).toHaveBeenCalledWith(false)
    expect(container).toBeEmptyDOMElement()
  })

  it('não mostra o painel quando não há pedidos pendentes', () => {
    usersQuery.current = { data: [{ ...pendingAgent, pendingApproval: false }], isError: false }
    const { container } = renderRequests()

    expect(container).toBeEmptyDOMElement()
  })

  it('avisa quando a aprovação falha', async () => {
    approve.mockRejectedValue(new Error('boom'))
    renderRequests()

    fireEvent.click(screen.getByRole('button', { name: 'Aprovar vínculo de Bruna Corretora' }))

    await waitFor(() =>
      expect(enqueueSnackbar).toHaveBeenCalledWith(expect.any(String), { variant: 'error' }),
    )
  })

  it('mostra erro quando não consegue carregar os pedidos', () => {
    usersQuery.current = { data: undefined, isError: true }
    renderRequests()

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os pedidos de vínculo.',
    )
  })
})
