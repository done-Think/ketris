import userEvent from '@testing-library/user-event'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useForm } from 'react-hook-form'

import { CreatePropertyStepFields } from '../../components/CreatePropertyStepFields'
import { createDashboardPropertyDefaultValues } from '../../schemas/create-dashboard-property-schema'
import type { PropertyNegotiationCondition } from '@shared/types/property-negotiation'
import type {
  CreateDashboardPropertyFormValues,
  CreatePropertyPurpose,
} from '../../types/dashboard-property'

function Wrapper({
  onValuesChange = () => {},
  purpose = ['SALE'],
  initialConditions = [],
  legacyTerms = '',
  onObservationChange = () => {},
}: {
  onValuesChange?: (mainValue: number) => void
  purpose?: CreatePropertyPurpose[]
  initialConditions?: PropertyNegotiationCondition[]
  legacyTerms?: string
  onObservationChange?: (value: string) => void
}) {
  const { control, watch, getValues, setValue } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: {
      ...createDashboardPropertyDefaultValues,
      mainValue: 0,
      rentalValue: 0,
      condominium: 0,
      propertyTax: 0,
      negotiationTerm: legacyTerms,
      negotiationConditions: initialConditions,
    },
  })

  onValuesChange(watch('mainValue'))
  onObservationChange(watch('negotiationTerm'))

  return (
    <CreatePropertyStepFields
      control={control}
      getValues={getValues}
      setValue={setValue}
      activeStepKey="values"
      activeStepLabel="Valores"
      propertyPurpose={purpose}
    />
  )
}

describe('CreatePropertyValuesStepFields', () => {
  it('restores saved choices and makes the existing text editable as an observation', () => {
    render(
      <Wrapper
        purpose={['RENT']}
        initialConditions={['REQUIRES_DEPOSIT']}
        legacyTerms="Caução de dois aluguéis"
      />,
    )
    expect(screen.getByRole('checkbox', { name: 'Exige caução' })).toBeChecked()
    expect(screen.getByRole('textbox', { name: 'Observação' })).toHaveValue(
      'Caução de dois aluguéis',
    )
    expect(screen.queryByText('Informação cadastrada anteriormente')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Condição' })).not.toBeInTheDocument()
  })

  it('lets the user replace or clear the optional observation without losing selected conditions', async () => {
    const user = userEvent.setup()
    let observation = ''
    render(
      <Wrapper
        purpose={['RENT']}
        initialConditions={['REQUIRES_DEPOSIT']}
        legacyTerms="Texto anterior"
        onObservationChange={(value) => {
          observation = value
        }}
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Observação' })
    await user.clear(input)
    await user.type(input, 'Entrada mínima a combinar com o proprietário.')
    expect(observation).toBe('Entrada mínima a combinar com o proprietário.')
    await user.clear(input)
    expect(observation).toBe('')
    expect(screen.getByRole('checkbox', { name: 'Exige caução' })).toBeChecked()
  })
  it('allows financing with a down payment and blocks the incompatible cash-only option', async () => {
    const user = userEvent.setup()
    render(<Wrapper />)
    await user.click(screen.getByRole('checkbox', { name: 'Aceita financiamento' }))
    await user.click(screen.getByRole('checkbox', { name: 'Exige entrada' }))
    expect(screen.getByRole('checkbox', { name: 'Aceita financiamento' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Exige entrada' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Apenas pagamento à vista' })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'Aceita financiamento' }))
    await user.click(screen.getByRole('checkbox', { name: 'Apenas pagamento à vista' }))
    expect(screen.getByRole('checkbox', { name: 'Aceita financiamento' })).toBeDisabled()
  })

  it('offers the deposit option only for rental properties and supports keyboard selection', async () => {
    const user = userEvent.setup()
    render(<Wrapper purpose={['RENT']} />)
    expect(screen.queryByRole('checkbox', { name: 'Aceita financiamento' })).not.toBeInTheDocument()
    const deposit = screen.getByRole('checkbox', { name: 'Exige caução' })
    act(() => deposit.focus())
    await user.keyboard(' ')
    expect(deposit).toBeChecked()
  })

  it.each<CreatePropertyPurpose[]>([['RENT'], ['SALE'], ['RENT', 'SALE']])(
    'uses the condition label for purpose %j',
    (...purpose) => {
      render(<Wrapper purpose={purpose} />)
      expect(screen.getByRole('group', { name: 'Condições de negociação' })).toBeVisible()
      expect(screen.queryByLabelText('Garantia')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Comissão')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Condição comercial')).not.toBeInTheDocument()
    },
  )

  it.each(['hover', 'keyboard', 'click'])(
    'explains the condition on %s and closes on Escape',
    async (interaction) => {
      const user = userEvent.setup()
      render(<Wrapper />)
      const help = screen.getByRole('button', { name: 'Sobre as condições de negociação' })
      if (interaction === 'hover') await user.hover(help)
      else if (interaction === 'click') await user.click(help)
      else {
        for (let index = 0; index < 4; index += 1) await user.tab()
        expect(help).toHaveFocus()
      }
      const tooltip = await screen.findByRole('tooltip')
      expect(tooltip).toHaveTextContent('A entrada pode ser combinada com financiamento.')
      expect(tooltip).toHaveTextContent('Para aluguel, indique se exige caução')
      expect(help).toHaveAccessibleDescription(tooltip.textContent!)
      await user.keyboard('{Escape}')
      await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
    },
  )

  it('opens the help on touch', async () => {
    vi.useFakeTimers()
    try {
      render(<Wrapper />)
      const help = screen.getByRole('button', { name: 'Sobre as condições de negociação' })
      await act(async () => {
        fireEvent.touchStart(help)
        await vi.advanceTimersByTimeAsync(100)
      })
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Selecione as condições aceitas para a venda ou o aluguel.',
      )
      await act(async () => {
        fireEvent.touchEnd(help)
        await vi.runOnlyPendingTimersAsync()
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it('preserves cents in a decimal currency value', async () => {
    let mainValue = 0

    render(<Wrapper onValuesChange={(value) => (mainValue = value)} />)

    const input = screen.getAllByRole('textbox')[0]
    await userEvent.type(input, '1500,50')

    expect(mainValue).toBe(1500.5)
  })

  it('parses a value with a thousands separator typed by the user correctly', async () => {
    let mainValue = 0

    render(<Wrapper onValuesChange={(value) => (mainValue = value)} />)

    const input = screen.getAllByRole('textbox')[0]
    await userEvent.type(input, '1.500')

    expect(mainValue).toBe(1500)
  })

  it('parses a plain integer currency value correctly', async () => {
    let mainValue = 0

    render(<Wrapper onValuesChange={(value) => (mainValue = value)} />)

    const input = screen.getAllByRole('textbox')[0]
    await userEvent.type(input, '6500')

    expect(mainValue).toBe(6500)
  })
})
