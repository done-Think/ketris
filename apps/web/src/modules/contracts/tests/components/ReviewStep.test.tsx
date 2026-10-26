import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import * as intl from 'next-intl'
import { afterEach, expect, it, vi } from 'vitest'
import { ReviewStep } from '../../components/contract-step-fields/ReviewStep'
import { contractEditValues } from '../../utils/contract-edit-values'
import type { CreateContractFormValues } from '../../types/contract'
import { apiContractFixture } from '../fixtures/contract'

afterEach(() => vi.restoreAllMocks())
function Review() {
  const { control } = useForm<CreateContractFormValues>({
    defaultValues: contractEditValues(apiContractFixture()),
  })
  return <ReviewStep control={control} />
}

it('formata as datas civis e os centavos na revisão conforme o idioma da interface', () => {
  const formatter = intl.createFormatter({ locale: 'en-US', timeZone: 'America/Sao_Paulo' })
  vi.spyOn(intl, 'useFormatter').mockReturnValue(formatter)
  render(<Review />)
  expect(
    screen.getByText(
      formatter.dateTime(new Date('2031-01-01T00:00:00Z'), { dateStyle: 'short', timeZone: 'UTC' }),
    ),
  ).toBeInTheDocument()
  expect(
    screen.getByText(
      formatter.dateTime(new Date('2032-01-01T00:00:00Z'), { dateStyle: 'short', timeZone: 'UTC' }),
    ),
  ).toBeInTheDocument()
  expect(
    screen.getByText(formatter.number(2450.75, { style: 'currency', currency: 'BRL' })),
  ).toBeInTheDocument()
})
