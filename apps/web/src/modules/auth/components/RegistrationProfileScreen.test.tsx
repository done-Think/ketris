import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RegistrationProfileScreen } from './RegistrationProfileScreen'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('RegistrationProfileScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    pushMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('anima o progresso antes de abrir a segunda etapa', () => {
    render(<RegistrationProfileScreen />)

    fireEvent.click(screen.getByRole('radio', { name: 'Corretor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(screen.getByRole('progressbar', { name: 'Etapa 2 de 3' })).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(320)
    })

    expect(pushMock).toHaveBeenCalledWith('/cadastro/dados?perfil=corretor')
  })
})
