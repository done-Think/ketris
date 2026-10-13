import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useForm, useWatch } from 'react-hook-form'

import { VerificationCodeField } from '../../components/VerificationCodeField'

function TestHarness() {
  const { control } = useForm({ defaultValues: { code: '' } })
  const code = useWatch({ control, name: 'code' })

  return (
    <div>
      <VerificationCodeField control={control} name="code" label="Código de verificação" />
      <output data-testid="code-value">{code}</output>
    </div>
  )
}

function getBoxes() {
  return screen.getAllByLabelText(/Código de verificação/)
}

describe('VerificationCodeField', () => {
  it('renderiza 6 caixas separadas', () => {
    render(<TestHarness />)

    expect(getBoxes()).toHaveLength(6)
  })

  it('avança automaticamente pra próxima caixa ao digitar cada dígito', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    const boxes = getBoxes()
    await user.click(boxes[0])
    await user.type(boxes[0], '123456')

    expect(screen.getByTestId('code-value')).toHaveTextContent('123456')
    boxes.forEach((box, index) => {
      expect(box).toHaveValue(String(index + 1))
    })
  })

  it('distribui os dígitos entre as caixas ao colar o código inteiro', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    const boxes = getBoxes()
    await user.click(boxes[0])
    await user.paste('123456')

    expect(screen.getByTestId('code-value')).toHaveTextContent('123456')
    boxes.forEach((box, index) => {
      expect(box).toHaveValue(String(index + 1))
    })
  })

  it('cola corretamente mesmo quando o clipboard tem caracteres não numéricos', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    const boxes = getBoxes()
    await user.click(boxes[0])
    await user.paste('12-34 56')

    expect(screen.getByTestId('code-value')).toHaveTextContent('123456')
  })

  it('Backspace numa caixa vazia apaga a anterior e move o foco pra ela', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    const boxes = getBoxes()
    await user.click(boxes[0])
    await user.type(boxes[0], '12')

    expect(boxes[2]).toHaveFocus()

    await user.keyboard('{Backspace}')

    expect(boxes[1]).toHaveFocus()
    expect(boxes[1]).toHaveValue('')
    expect(boxes[0]).toHaveValue('1')
  })

  it('navega entre as caixas com as setas do teclado', async () => {
    const user = userEvent.setup()
    render(<TestHarness />)

    const boxes = getBoxes()
    await user.click(boxes[2])
    await user.keyboard('{ArrowLeft}')

    expect(boxes[1]).toHaveFocus()

    await user.keyboard('{ArrowRight}{ArrowRight}')

    expect(boxes[3]).toHaveFocus()
  })
})
