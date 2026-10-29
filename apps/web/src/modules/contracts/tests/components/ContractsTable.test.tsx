import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { ContractsTable } from '../../components/ContractsTable'
import { mapContractFromApi } from '../../utils/contract-adapter'
import { apiContractFixture } from '../fixtures/contract'

function setup(canEdit: boolean) {
  const row = mapContractFromApi(apiContractFixture(), {
    date: (value) => value,
    money: (value) => String(value),
    guarantee: (value) => value,
    adjustment: (value) => value,
    paymentDay: (value) => String(value),
  })
  row.canEdit = canEdit
  const action = vi.fn(),
    pagination = vi.fn(),
    sort = vi.fn(),
    select = vi.fn()
  render(
    <ContractsTable
      contracts={[row]}
      totalCount={26}
      loading={false}
      paginationModel={{ page: 0, pageSize: 5 }}
      onPaginationModelChange={pagination}
      sortModel={[]}
      onSortModelChange={sort}
      onContractAction={action}
      onContractSelect={select}
    />,
  )
  return { row, action, pagination, sort, select }
}

it('oferece ações reais e impede editar o contrato bloqueado sem exibir ações simuladas', async () => {
  const { row, action } = setup(false)
  fireEvent.click(screen.getByRole('button', { name: 'Ações do contrato ' + row.code }))
  expect(screen.getByRole('menuitem', { name: 'Editar dados' })).toHaveAttribute(
    'aria-disabled',
    'true',
  )
  expect(
    screen.queryByRole('menuitem', { name: /Duplicar|minuta|Enviar assinatura|Copiar link/i }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('menuitem', { name: 'Ver documentos' }))
  expect(action).toHaveBeenCalledWith(row, 'view-documents')
})

it('encaminha paginação e ordenação para o servidor e abre o contrato pela linha', async () => {
  const { row, pagination, sort, select } = setup(true)
  fireEvent.click(screen.getByRole('button', { name: 'Próxima página' }))
  await waitFor(() =>
    expect(pagination).toHaveBeenLastCalledWith({ page: 1, pageSize: 5 }, expect.anything()),
  )
  fireEvent.click(screen.getByRole('columnheader', { name: /Valor/ }))
  expect(sort).toHaveBeenCalledWith([{ field: 'amount', sort: 'asc' }], expect.anything())
  fireEvent.click(screen.getByText(row.property))
  expect(select).toHaveBeenCalledWith(row)
})
