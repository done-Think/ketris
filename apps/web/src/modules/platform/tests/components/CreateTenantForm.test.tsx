import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { CreateTenantForm } from '../../components/CreateTenantForm'

const { mutateAsync, enqueueSnackbar } = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  enqueueSnackbar: vi.fn(),
}))
vi.mock('../../hooks/use-create-tenant', () => ({
  useCreateTenant: () => ({ mutateAsync, isError: false, error: null }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

function renderForm() {
  return render(
    <ThemeProvider theme={theme}>
      <CreateTenantForm />
    </ThemeProvider>,
  )
}

describe('CreateTenantForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('explica a tela e o próximo passo', () => {
    renderForm()

    expect(screen.getByRole('heading', { name: 'Dados da imobiliária' })).toBeVisible()
    expect(screen.getByText(/para cadastrar o administrador dela/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/platform/tenants',
    )
  })

  it('preenche o identificador a partir do nome até ele ser editado à mão', async () => {
    const user = userEvent.setup()
    renderForm()
    const name = screen.getByLabelText('Nome')
    const slug = screen.getByLabelText('Identificador (slug)')

    await user.type(name, 'Imobiliária São João')
    expect(slug).toHaveValue('imobiliaria-sao-joao')

    await user.clear(slug)
    await user.type(slug, 'sao-joao')
    await user.type(name, ' Ltda')
    expect(slug).toHaveValue('sao-joao')

    await user.clear(slug)
    await user.type(name, '!')
    expect(slug).toHaveValue('imobiliaria-sao-joao-ltda')
  })

  it('mostra os erros sem enviar quando os campos estão vazios', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Criar imobiliária' }))

    expect(await screen.findByText('Informe o nome')).toBeVisible()
    expect(screen.getByText('Informe o slug')).toBeVisible()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('envia o nome e o identificador sugerido', async () => {
    const user = userEvent.setup()
    mutateAsync.mockResolvedValue({ id: 'tenant-1', name: 'Aurora Imóveis' })
    renderForm()

    await user.type(screen.getByLabelText('Nome'), 'Aurora Imóveis')
    await user.click(screen.getByRole('button', { name: 'Criar imobiliária' }))

    expect(mutateAsync).toHaveBeenCalledWith({ name: 'Aurora Imóveis', slug: 'aurora-imoveis' })
    expect(enqueueSnackbar).toHaveBeenCalledWith('Imobiliária Aurora Imóveis criada com sucesso.', {
      variant: 'success',
    })
  })
})
