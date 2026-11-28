import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OverviewPage } from '../components/console/overview/OverviewPage'
import { useOverview } from '../hooks/use-console-queries'
import { ApiError } from '../services/api-error'

vi.mock('../hooks/use-console-queries', () => ({ useOverview: vi.fn() }))
vi.mock('../components/console/new-verification/NewVerificationDialog', () => ({
  NewVerificationDialog: () => null,
}))

describe('Face Check overview availability', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows the error and manual retry instead of a loading placeholder', async () => {
    const refetch = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useOverview, { partial: true }).mockReturnValue({
      error: new ApiError('STORAGE_UNAVAILABLE', 503),
      isLoading: false,
      isFetching: false,
      data: undefined,
      refetch,
    })
    render(<OverviewPage />)

    expect(screen.queryByRole('status', { name: 'Carregando indicadores' })).not.toBeInTheDocument()
    expect(
      screen.getByText('O armazenamento está indisponível. Tente novamente mais tarde.'),
    ).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows loading only during a request and prevents duplicate manual retries', () => {
    vi.mocked(useOverview, { partial: true }).mockReturnValue({
      error: null,
      isLoading: true,
      isFetching: true,
      data: undefined,
    })
    const view = render(<OverviewPage />)
    expect(screen.getByRole('status', { name: 'Carregando indicadores' })).toBeVisible()

    vi.mocked(useOverview, { partial: true }).mockReturnValue({
      error: new ApiError('STORAGE_UNAVAILABLE', 503),
      isLoading: false,
      isFetching: true,
      data: undefined,
    })
    view.rerender(<OverviewPage />)
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeDisabled()
  })
})
