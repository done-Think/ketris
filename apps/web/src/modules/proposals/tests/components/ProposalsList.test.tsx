import { ThemeProvider } from '@mui/material'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { ProposalsList } from '../../components/ProposalsList'
import { dashboardProposals } from '../../data/proposals'

const mocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => mocks.searchParams,
}))

function renderList() {
  return render(
    <ThemeProvider theme={theme}>
      <ProposalsList proposals={dashboardProposals} />
    </ThemeProvider>,
  )
}

describe('ProposalsList', () => {
  beforeEach(() => {
    mocks.searchParams = new URLSearchParams()
  })

  it('renders every proposal row', () => {
    renderList()

    expect(screen.getByText('Carla Rocha')).toBeVisible()
    expect(screen.getByText('Rafael Lima')).toBeVisible()
    expect(screen.getByText('João Silva')).toBeVisible()
  })

  it('opens the detail dialog with the proposal data when a row is clicked', async () => {
    const user = userEvent.setup()
    renderList()

    await user.click(screen.getByText('Rafael Lima'))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Casa Alto da Boa Vista')).toBeVisible()
    expect(within(dialog).getByText('R$ 3.650.000')).toBeVisible()
    expect(within(dialog).getByText('Pede R$ 3.800.000')).toBeVisible()
  })

  it('opens the detail dialog for the proposal referenced by the proposalId query param', () => {
    mocks.searchParams = new URLSearchParams({ proposalId: 'proposal-002' })
    renderList()

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Rafael Lima')).toBeVisible()
  })
})
