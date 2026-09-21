import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { CreateLeadDialog } from '../../components/CreateLeadDialog'
import { useCreateLead } from '../../hooks/use-leads'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('../../hooks/use-leads', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../hooks/use-leads')>()

  return { ...original, useCreateLead: vi.fn() }
})

const mocks = vi.hoisted(() => ({
  enqueueSnackbar: vi.fn(),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }),
}))

function mockCreateLead(overrides: Record<string, unknown> = {}) {
  vi.mocked(useCreateLead).mockReturnValue({
    mutate: vi.fn((_payload, options) => options?.onSuccess?.()),
    isPending: false,
    ...overrides,
  } as unknown as ReturnType<typeof useCreateLead>)
}

function renderDialog(onClose = vi.fn()) {
  return render(
    <ThemeProvider theme={theme}>
      <CreateLeadDialog open onClose={onClose} />
    </ThemeProvider>,
  )
}

async function fillContactStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome'), 'Beatriz Nunes')
  await user.type(screen.getByLabelText('Telefone'), '11988887777')
  await user.type(screen.getByLabelText('E-mail'), 'beatriz@example.com')
}

async function fillInterestStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Imóvel ou interesse'), 'Studio Pinheiros')
  await user.type(screen.getByLabelText('Orçamento'), 'R$ 3.200')
}

describe('CreateLeadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)
    mockCreateLead()
  })

  it('renders the create lead title and the first step fields', () => {
    renderDialog()

    expect(screen.getByText('Registrar lead')).toBeVisible()
    expect(screen.getByLabelText('Nome')).toBeVisible()
    expect(screen.getByLabelText('Telefone')).toBeVisible()
    expect(screen.getByLabelText('E-mail')).toBeVisible()
  })

  it('blocks advancing to the next step when required fields are missing', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.click(screen.getByRole('button', { name: 'Próximo' }))

    expect(await screen.findByText('Informe o nome do lead')).toBeVisible()
    expect(screen.queryByLabelText('Imóvel ou interesse')).not.toBeInTheDocument()
  })

  it('walks through all three steps and shows the entered data on review', async () => {
    const user = userEvent.setup()
    renderDialog()

    await fillContactStep(user)
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await fillInterestStep(user)
    await user.click(screen.getByRole('button', { name: 'Próximo' }))

    expect(screen.getByText('Beatriz Nunes')).toBeVisible()
    expect(screen.getByText('Studio Pinheiros')).toBeVisible()
    expect(screen.getByText('R$ 3.200')).toBeVisible()
  })

  it('lets the user go back to a previous step', async () => {
    const user = userEvent.setup()
    renderDialog()

    await fillContactStep(user)
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.getByLabelText('Nome')).toHaveValue('Beatriz Nunes')
  })

  it('creates the lead, notifies success and closes the dialog on submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const mutate = vi.fn((_payload, options) => options?.onSuccess?.())
    mockCreateLead({ mutate })
    renderDialog(onClose)

    await fillContactStep(user)
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await fillInterestStep(user)
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.click(screen.getByRole('button', { name: 'Criar lead' }))

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Beatriz Nunes',
        phone: '(11) 98888-7777',
        email: 'beatriz@example.com',
        interest: 'Studio Pinheiros',
      }),
      expect.anything(),
    )
    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      'Lead registrado com sucesso.',
      expect.objectContaining({ variant: 'success' }),
    )
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows an error message and keeps the dialog open when creation fails', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    mockCreateLead({ mutate: vi.fn((_payload, options) => options?.onError?.(new Error('boom'))) })
    renderDialog(onClose)

    await fillContactStep(user)
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await fillInterestStep(user)
    await user.click(screen.getByRole('button', { name: 'Próximo' }))
    await user.click(screen.getByRole('button', { name: 'Criar lead' }))

    expect(mocks.enqueueSnackbar).toHaveBeenCalledWith(
      'Não foi possível registrar o lead. Tente novamente.',
      expect.objectContaining({ variant: 'error' }),
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose without creating a lead when cancelled', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const mutate = vi.fn()
    mockCreateLead({ mutate })
    renderDialog(onClose)

    await fillContactStep(user)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onClose).toHaveBeenCalledOnce()
    expect(mutate).not.toHaveBeenCalled()
  })
})
