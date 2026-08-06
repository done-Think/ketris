import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RegistrationProfileStep } from './RegistrationProfileStep'

const continueMock = vi.fn()

function renderProfileStep(isAdvancing = false) {
  return render(<RegistrationProfileStep isAdvancing={isAdvancing} onContinue={continueMock} />)
}

describe('RegistrationProfileStep', () => {
  beforeEach(() => {
    continueMock.mockClear()
  })

  it('exibe os perfis e inicia com proprietário selecionado', () => {
    renderProfileStep()

    expect(screen.getByRole('heading', { name: 'Qual é o seu perfil?' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByRole('radio', { name: 'Proprietário' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled()
  })

  it.each(['Corretor', 'Imobiliária', 'Construtora', 'Locatário'])(
    'permite selecionar o perfil %s pela caixa inteira',
    async (profileName) => {
      const user = userEvent.setup()
      renderProfileStep()

      await user.click(screen.getByRole('radio', { name: profileName }))

      expect(screen.getByRole('radio', { name: profileName })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Proprietário' })).not.toBeChecked()
    },
  )

  it('permite alterar a seleção usando o teclado', async () => {
    const user = userEvent.setup()
    renderProfileStep()

    const ownerOption = screen.getByRole('radio', { name: 'Proprietário' })
    await user.click(ownerOption)
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Corretor' })).toBeChecked()
  })

  it('entrega o perfil selecionado ao avançar', async () => {
    const user = userEvent.setup()
    renderProfileStep()

    await user.click(screen.getByRole('radio', { name: 'Imobiliária' }))
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(continueMock).toHaveBeenCalledWith('imobiliaria')
  })

  it('bloqueia cliques repetidos durante a transição', () => {
    renderProfileStep(true)

    expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled()
  })
})
