import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CreatePropertyAddressStepFields } from '../../components/CreatePropertyAddressStepFields'
import { createDashboardPropertyDefaultValues } from '../../schemas/create-dashboard-property-schema'
import type { CreateDashboardPropertyFormValues } from '../../types/dashboard-property'
import type { PostalCodeAddress } from '../../types/postal-code'

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }))
vi.mock('../../services/postal-code-service', async () => ({
  ...(await vi.importActual<typeof import('../../services/postal-code-service')>(
    '../../services/postal-code-service',
  )),
  lookupPostalCode: lookup,
}))
const address: PostalCodeAddress = {
  street: 'Rua Padre Júlio Chevalier',
  neighborhood: 'Anhumas',
  city: 'Itajubá',
  state: 'MG',
}

function Wrapper({ zipCode = '' }: { zipCode?: string }) {
  const { control, setValue, getValues } = useForm<CreateDashboardPropertyFormValues>({
    defaultValues: {
      ...createDashboardPropertyDefaultValues,
      zipCode,
      number: '35',
      complement: 'apto 101',
      latitude: -23.55,
      longitude: -46.63,
    },
  })
  return (
    <CreatePropertyAddressStepFields
      control={control}
      setValue={setValue}
      getValues={getValues}
      onAddressChange={() => {
        setValue('latitude', null)
        setValue('longitude', null)
      }}
    />
  )
}
function enterPostalCode(value: string) {
  fireEvent.input(screen.getByLabelText('CEP'), { target: { value } })
  fireEvent.blur(screen.getByLabelText('CEP'))
}

beforeEach(() => vi.resetAllMocks())
describe('property address by postal code', () => {
  it('formats a saved unmasked CEP without clearing the saved coordinates', () => {
    render(<Wrapper zipCode="37502330" />)
    expect(screen.getByLabelText('CEP')).toHaveValue('37502-330')
    expect(screen.getByLabelText('Latitude (opcional)')).toHaveValue(-23.55)
    expect(screen.getByLabelText('Longitude (opcional)')).toHaveValue(-46.63)
    expect(lookup).not.toHaveBeenCalled()
  })

  it.each(['37502330', '37502-330', '37.502-330', '37 502 330'])(
    'accepts pasted CEP %s and looks it up using eight digits',
    async (value) => {
      lookup.mockResolvedValue(address)
      const user = userEvent.setup()
      render(<Wrapper />)
      await user.click(screen.getByLabelText('CEP'))
      await user.paste(value)
      expect(screen.getByLabelText('CEP')).toHaveValue('37502-330')
      await user.tab()
      await waitFor(() => expect(lookup).toHaveBeenCalledWith('37502330', expect.any(AbortSignal)))
    },
  )

  it('fills the address on CEP blur while preserving number and complement and clearing stale coordinates', async () => {
    lookup.mockResolvedValue(address)
    render(<Wrapper />)
    enterPostalCode('37502-330')
    await waitFor(() => expect(screen.getByLabelText('Endereço')).toHaveValue(address.street))
    expect(screen.getByLabelText('Bairro')).toHaveValue('Anhumas')
    expect(screen.getByLabelText('Cidade')).toHaveValue('Itajubá')
    expect(screen.getByLabelText('Estado')).toHaveValue('MG')
    expect(screen.getByLabelText('Número')).toHaveValue('35')
    expect(screen.getByLabelText('Complemento')).toHaveValue('apto 101')
    expect(screen.getByLabelText('Latitude (opcional)')).toHaveValue(null)
    expect(screen.getByLabelText('Longitude (opcional)')).toHaveValue(null)
    expect(lookup).toHaveBeenCalledWith('37502330', expect.any(AbortSignal))
  })

  it('preserves a manual edit made while the lookup is pending', async () => {
    let finish!: (value: PostalCodeAddress) => void
    lookup.mockImplementation(
      () =>
        new Promise<PostalCodeAddress>((resolve) => {
          finish = resolve
        }),
    )
    render(<Wrapper />)
    enterPostalCode('37502330')
    fireEvent.change(screen.getByLabelText('Endereço'), {
      target: { value: 'Rua informada manualmente' },
    })
    await act(async () => finish(address))
    expect(screen.getByLabelText('Endereço')).toHaveValue('Rua informada manualmente')
    expect(screen.getByLabelText('Cidade')).toHaveValue('Itajubá')
  })

  it('ignores an old response after the user enters another CEP', async () => {
    let finish!: (value: PostalCodeAddress) => void
    lookup
      .mockImplementationOnce(
        () =>
          new Promise<PostalCodeAddress>((resolve) => {
            finish = resolve
          }),
      )
      .mockResolvedValueOnce({ ...address, street: 'Rua Nova', city: 'Outra cidade' })
    render(<Wrapper />)
    enterPostalCode('37502330')
    const firstSignal = lookup.mock.calls[0][1] as AbortSignal
    enterPostalCode('01001000')
    await waitFor(() => expect(screen.getByLabelText('Endereço')).toHaveValue('Rua Nova'))
    expect(firstSignal.aborted).toBe(true)
    await act(async () => finish(address))
    expect(screen.getByLabelText('Cidade')).toHaveValue('Outra cidade')
  })

  it.each([
    ['missing', null],
    ['failure', new Error('Network unavailable')],
  ])('keeps manual entry available for lookup %s', async (_kind, value) => {
    if (value instanceof Error) lookup.mockRejectedValue(value)
    else lookup.mockResolvedValue(value)
    render(<Wrapper />)
    enterPostalCode('99999999')
    await waitFor(() =>
      expect(screen.getByText(/preench[ae]r? o endereço manualmente\./i)).toBeInTheDocument(),
    )
    fireEvent.change(screen.getByLabelText('Endereço'), { target: { value: 'Endereço manual' } })
    expect(screen.getByLabelText('Endereço')).toHaveValue('Endereço manual')
  })
})
