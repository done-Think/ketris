import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ContractActions } from '../../components/ContractActions'
import { ContractStepsNav } from '../../components/ContractStepsNav'

describe('navegação do cadastro de contratos', () => {
  it('impede selecionar uma etapa ainda não liberada e permite voltar à etapa anterior', () => {
    const select = vi.fn()
    render(<ContractStepsNav activeStepIndex={1} maxStepIndex={1} onStepSelect={select} />)
    const opportunity = screen.getByRole('button', { name: /Oportunidade/i })
    const conditions = screen.getByRole('button', { name: /Condições/i })
    expect(conditions).toBeDisabled()
    fireEvent.click(opportunity)
    expect(select).toHaveBeenCalledWith(0)
    fireEvent.click(conditions)
    expect(select).toHaveBeenCalledTimes(1)
  })

  it('mostra avanço nas etapas e bloqueia o envio final enquanto grava', () => {
    const next = vi.fn(),
      previous = vi.fn()
    const { rerender } = render(
      <ContractActions
        lastStep={false}
        isSubmitting={false}
        onNextStep={next}
        onPreviousStep={previous}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Próximo passo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(next).toHaveBeenCalledOnce()
    expect(previous).toHaveBeenCalledOnce()
    rerender(<ContractActions lastStep isSubmitting onNextStep={next} onPreviousStep={previous} />)
    expect(screen.getByRole('button', { name: 'Gerar contrato' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Gerar contrato' }))
    expect(next).toHaveBeenCalledOnce()
  })
})
