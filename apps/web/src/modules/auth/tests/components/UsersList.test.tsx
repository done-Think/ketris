import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { userService } from '../../services/user-service'
import type { TenantUser } from '../../types/user'
import { UsersList } from '../../components/UsersList'

vi.mock('../../services/user-service', () => ({
  userService: {
    list: vi.fn(),
    approveMembership: vi.fn(),
  },
}))

const activeUser: TenantUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Ana Proprietária',
  email: 'ana@ketris.dev',
  role: 'OWNER',
  active: true,
  pendingApproval: false,
}

const pendingUser: TenantUser = {
  id: 'user-2',
  tenantId: 'tenant-1',
  name: 'Corretor Pendente',
  email: 'corretor@ketris.dev',
  role: 'AGENT',
  active: true,
  pendingApproval: true,
}

function renderUsersList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <UsersList />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('UsersList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lista os usuários com papel e status, sem botão de aprovar para quem já está ativo', async () => {
    vi.mocked(userService.list).mockResolvedValue([activeUser])

    renderUsersList()

    expect(await screen.findByText('Ana Proprietária')).toBeInTheDocument()
    expect(screen.getByText('OWNER')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument()
  })

  it('mostra chip pendente e botão de aprovar para um vínculo ainda não aprovado', async () => {
    vi.mocked(userService.list).mockResolvedValue([pendingUser])

    renderUsersList()

    expect(await screen.findByText('Corretor Pendente')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument()
  })

  it('aprova o vínculo ao clicar em "Aprovar"', async () => {
    const user = userEvent.setup()
    vi.mocked(userService.list).mockResolvedValue([pendingUser])
    vi.mocked(userService.approveMembership).mockResolvedValue({
      ...pendingUser,
      pendingApproval: false,
    })

    renderUsersList()

    await user.click(await screen.findByRole('button', { name: 'Aprovar' }))

    await waitFor(() => expect(userService.approveMembership).toHaveBeenCalledWith(pendingUser.id))
  })

  it('mostra mensagem de vazio quando não há usuários', async () => {
    vi.mocked(userService.list).mockResolvedValue([])

    renderUsersList()

    expect(await screen.findByText('Nenhum membro da equipe cadastrado ainda.')).toBeInTheDocument()
  })

  it('mostra mensagem de erro quando a listagem falha', async () => {
    vi.mocked(userService.list).mockRejectedValue(new Error('falhou'))

    renderUsersList()

    expect(await screen.findByText('Não foi possível carregar a equipe.')).toBeInTheDocument()
  })
})
