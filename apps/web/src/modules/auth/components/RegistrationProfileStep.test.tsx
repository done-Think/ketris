import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { RegistrationProfileStep } from './RegistrationProfileStep'

describe('RegistrationProfileStep', () => {
  it('exibe os perfis e inicia com proprietário selecionado', () => {
    render(<RegistrationProfileStep />)

    expect(screen.getByRole('heading', { name: 'Qual é o seu perfil?' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByRole('radio', { name: 'Proprietário' })).toBeChecked()
    expect(screen.getByRole('link', { name: 'Continuar' })).toHaveAttribute(
      'href',
      '/cadastro/dados?perfil=proprietario',
    )
  })

  it.each(['Corretor', 'Imobiliária', 'Construtora', 'Locatário'])(
    'permite selecionar o perfil %s pela caixa inteira',
    async (profileName) => {
      const user = userEvent.setup()
      render(<RegistrationProfileStep />)

      await user.click(screen.getByRole('radio', { name: profileName }))

      expect(screen.getByRole('radio', { name: profileName })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'Proprietário' })).not.toBeChecked()
    },
  )

  it('permite alterar a seleção usando o teclado', async () => {
    const user = userEvent.setup()
    render(<RegistrationProfileStep />)

    const ownerOption = screen.getByRole('radio', { name: 'Proprietário' })
    await user.click(ownerOption)
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Corretor' })).toBeChecked()
  })

  it('leva o perfil selecionado para a rota da segunda etapa', async () => {
    const user = userEvent.setup()
    render(<RegistrationProfileStep />)

    await user.click(screen.getByRole('radio', { name: 'Imobiliária' }))

    expect(screen.getByRole('link', { name: 'Continuar' })).toHaveAttribute(
      'href',
      '/cadastro/dados?perfil=imobiliaria',
    )
  })
})
