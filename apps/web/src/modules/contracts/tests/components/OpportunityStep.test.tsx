import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { afterEach, expect, it, vi } from 'vitest'
import { OpportunityStep } from '../../components/contract-step-fields/OpportunityStep'
import { contractsService } from '../../services/contracts-service'
import { createContractDefaultValues } from '../../schemas/create-contract-schema'
import type { CreateContractFormValues } from '../../types/contract'
import type { ContractOpportunity } from '../../types/service'

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { tenantId: 'agency', user: { id: 'manager' }, role: 'OWNER' } }),
}))
afterEach(() => vi.restoreAllMocks())
const first: ContractOpportunity = {
  id: 'first',
  leadName: 'Primeira pessoa',
  leadEmail: 'first@example.test',
  leadPhone: '11999999999',
  propertyId: 'property',
  propertyTitle: 'Apartamento primeiro',
  propertyAddress: 'Rua Um',
  proposedValue: 2450.75,
  owner: {
    id: 'owner',
    name: 'Proprietária primeira',
    email: 'owner@example.test',
    phone: '11988888888',
  },
}
const second: ContractOpportunity = {
  ...first,
  id: 'second',
  leadName: 'Segunda pessoa',
  leadEmail: 'second@example.test',
  leadPhone: null,
  propertyTitle: 'Apartamento segundo',
  owner: null,
  proposedValue: 1800.25,
}
function Form() {
  const { control, setValue } = useForm<CreateContractFormValues>({
    defaultValues: createContractDefaultValues,
  })
  const values = useWatch({ control })
  return (
    <>
      <OpportunityStep control={control} setValue={setValue} />
      <button
        onClick={() => {
          setValue('tenantPhone', 'Telefone editado')
          setValue('ownerName', 'Nome revisado')
        }}
      >
        Editar localmente
      </button>
      <output aria-label="Valores do contrato">{JSON.stringify(values)}</output>
    </>
  )
}
function values() {
  return JSON.parse(screen.getByLabelText('Valores do contrato').textContent ?? '{}')
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Form />
    </QueryClientProvider>,
  )
  return client
}

it('preenche dados reais, preserva a edição no refetch e limpa dados ausentes ao trocar a proposta', async () => {
  vi.spyOn(contractsService, 'opportunities').mockResolvedValue({
    items: [first, second],
    totalCount: 2,
    page: 1,
    pageSize: 25,
  })
  const client = setup()
  const input = screen.getByRole('combobox')
  await waitFor(() => expect(contractsService.opportunities).toHaveBeenCalled())
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  fireEvent.click(await screen.findByRole('option', { name: /Primeira pessoa/ }))
  expect(values()).toMatchObject({
    opportunityId: 'first',
    amount: 2450.75,
    ownerName: 'Proprietária primeira',
    tenantPhone: '11999999999',
  })
  fireEvent.click(screen.getByRole('button', { name: 'Editar localmente' }))
  await client.invalidateQueries({ queryKey: ['contracts'] })
  expect(values()).toMatchObject({ ownerName: 'Nome revisado', tenantPhone: 'Telefone editado' })
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  fireEvent.click(await screen.findByRole('option', { name: /Segunda pessoa/ }))
  expect(values()).toMatchObject({
    opportunityId: 'second',
    amount: 1800.25,
    tenantEmail: 'second@example.test',
    tenantPhone: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerCpf: '',
    tenantCpf: '',
  })
})

it('carrega mais páginas de propostas sem depender da listagem de CRM ou de contratos', async () => {
  const list = vi
    .spyOn(contractsService, 'opportunities')
    .mockImplementation(async ({ page = 1 }) => ({
      items: page === 1 ? [first] : [second],
      totalCount: 26,
      page,
      pageSize: 25,
    }))
  setup()
  fireEvent.click(await screen.findByRole('button', { name: 'Carregar mais propostas' }))
  await waitFor(() => expect(list).toHaveBeenLastCalledWith({ search: '', page: 2, pageSize: 25 }))
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' })
  expect(await screen.findByRole('option', { name: /Segunda pessoa/ })).toBeInTheDocument()
})
