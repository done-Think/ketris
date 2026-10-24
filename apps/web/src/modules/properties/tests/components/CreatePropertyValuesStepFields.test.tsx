import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useForm } from 'react-hook-form'

import { CreatePropertyValuesStepFields } from '../../components/CreatePropertyValuesStepFields'
import type { CreateDashboardPropertyFormValues } from '../../types/dashboard-property'

function Wrapper({ onValuesChange }: { onValuesChange: (mainValue: number) => void }) {
  const { control, watch } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: {
      mainValue: 0,
      rentalValue: 0,
      condominium: 0,
      iptu: 0,
      negotiationTerm: '',
    } as CreateDashboardPropertyFormValues,
  })

  onValuesChange(watch('mainValue'))

  return (
    <CreatePropertyValuesStepFields
      control={control}
      hasDualPurpose={false}
      mainValueLabel="saleValue"
      negotiationTermLabel="commission"
    />
  )
}

describe('CreatePropertyValuesStepFields', () => {
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
