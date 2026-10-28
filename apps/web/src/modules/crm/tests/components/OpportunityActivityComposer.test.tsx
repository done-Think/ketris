import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OpportunityActivityComposer } from '../../components/opportunity-detail/OpportunityActivityComposer'

const record = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/use-opportunities', () => ({
  useRecordOpportunityActivity: () => ({
    mutateAsync: record,
    isPending: false,
    isSuccess: false,
    isError: false,
  }),
}))

describe('OpportunityActivityComposer', () => {
  beforeEach(() => {
    record.mockReset().mockResolvedValue({})
  })

  it('records a real contact separately from a note and clears the successful entry', async () => {
    const user = userEvent.setup()
    render(<OpportunityActivityComposer opportunityId="opportunity" />)
    fireEvent.mouseDown(screen.getByLabelText('Tipo de atividade'))
    await user.click(screen.getByRole('option', { name: 'Contato realizado' }))
    await user.type(screen.getByLabelText('Descrição'), '  Ligação com o cliente  ')
    await user.click(screen.getByRole('button', { name: 'Registrar atividade' }))

    await waitFor(() =>
      expect(record).toHaveBeenCalledWith({
        description: 'Ligação com o cliente',
        type: 'CONTACT_MADE',
      }),
    )
    await waitFor(() => expect(screen.getByLabelText('Descrição')).toHaveValue(''))
  })

  it('does not record an empty activity', async () => {
    const user = userEvent.setup()
    render(<OpportunityActivityComposer opportunityId="opportunity" />)
    await user.type(screen.getByLabelText('Descrição'), '   ')
    await user.click(screen.getByRole('button', { name: 'Registrar atividade' }))
    expect(record).not.toHaveBeenCalled()
    expect(screen.getByText('Descreva a atividade.')).toBeVisible()
  })
})
