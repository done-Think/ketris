import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PriceRangeMenu } from '../../components/PriceRangeMenu'

describe('free marketplace price range', () => {
  it('accepts a maximum above ten thousand and commits only on apply', async () => {
    const user = userEvent.setup()
    const update = vi.fn()
    const close = vi.fn()
    render(
      <PriceRangeMenu
        priceRange={[null, null]}
        updatePriceRange={update}
        closeSearchMenu={close}
      />,
    )
    const maximum = screen.getByRole('spinbutton', { name: 'Máximo' })
    expect(maximum).not.toHaveAttribute('max')
    await user.type(maximum, '750000')
    expect(update).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(update).toHaveBeenCalledWith([null, 750000])
    expect(close).toHaveBeenCalledOnce()
  })

  it('removes the upper limit when the maximum field is cleared', async () => {
    const user = userEvent.setup()
    const update = vi.fn()
    render(
      <PriceRangeMenu
        priceRange={[25000, 750000]}
        updatePriceRange={update}
        closeSearchMenu={vi.fn()}
      />,
    )
    await user.clear(screen.getByRole('spinbutton', { name: 'Máximo' }))
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(update).toHaveBeenCalledWith([25000, null])
  })

  it('blocks a negative or reversed range instead of silently changing the entered values', async () => {
    const user = userEvent.setup()
    const update = vi.fn()
    render(
      <PriceRangeMenu
        priceRange={[50000, 10000]}
        updatePriceRange={update}
        closeSearchMenu={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled()
    expect(screen.getByText('Valor de preço inválido')).toBeVisible()
    await user.clear(screen.getByRole('spinbutton', { name: 'Mínimo' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Mínimo' }), '-1')
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled()
    expect(update).not.toHaveBeenCalled()
  })
})
