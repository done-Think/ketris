import { createFormatter } from 'next-intl'
import { expect, it } from 'vitest'
import { mapContractFromApi, buildCreateContractPayload } from '../../utils/contract-adapter'
import { contractEditValues, buildEditContractPayload } from '../../utils/contract-edit-values'
import { apiContractFixture } from '../fixtures/contract'

it.each(['pt-BR', 'en-US', 'es-ES'])(
  'apresenta valores em BRL e datas civis conforme %s sem deslocar o dia',
  (locale) => {
    const formatter = createFormatter({ locale, timeZone: 'America/Sao_Paulo' })
    const contract = apiContractFixture()
    const display = mapContractFromApi(contract, {
      date: (value) => formatter.dateTime(new Date(value), { dateStyle: 'short', timeZone: 'UTC' }),
      money: (value) => formatter.number(value, { style: 'currency', currency: 'BRL' }),
      guarantee: (value) => value,
      adjustment: (value) => value,
      paymentDay: (value) => String(value),
    })
    expect(display.amount).toBe(formatter.number(2450.75, { style: 'currency', currency: 'BRL' }))
    expect(display.startDate).toBe(
      formatter.dateTime(new Date('2031-01-01T00:00:00Z'), { dateStyle: 'short', timeZone: 'UTC' }),
    )
    expect(display.property).toBe('Apartamento')
  },
)

it('preserva centavos, partes e datas ao preparar edição e não envia origem ou imóvel', () => {
  const contract = apiContractFixture()
  const values = contractEditValues(contract)
  const create = buildCreateContractPayload(values)
  const edit = buildEditContractPayload(values)
  expect(create).toMatchObject({
    opportunityId: contract.opportunityId,
    amount: 2450.75,
    startDate: '2031-01-01',
    endDate: '2032-01-01',
  })
  expect(edit).toMatchObject({
    amount: 2450.75,
    owner: { cpf: contract.parties[0].cpf },
    tenant: { cpf: contract.parties[1].cpf },
  })
  expect(edit).not.toHaveProperty('opportunityId')
  expect(edit).not.toHaveProperty('propertyId')
  expect(edit.guarantor).toBeNull()
})
