import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ChargesRoute from '@/app/[locale]/(maintenance-preview)/dashboard/finance/charges/page'
import ChargeDetailsRoute from '@/app/[locale]/(maintenance-preview)/dashboard/finance/charges/[id]/page'
import FinancialRoute from '@/app/[locale]/(dashboard)/dashboard/finance/page'

const state = vi.hoisted(() => ({ role: 'RENTER', replace: vi.fn() }))

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { role: state.role, tenantId: 'tenant-1', scope: 'tenant' },
    status: 'authenticated',
  }),
}))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ replace: state.replace }) }))
vi.mock('@modules/financial', () => ({
  ChargesPage: () => <div>Lista de cobranças permitidas</div>,
  ChargeDetailsPage: () => <div>Detalhe da cobrança permitida</div>,
  FinancialDashboardPage: () => <div>Resumo financeiro da imobiliária</div>,
}))

describe('Financial page access', () => {
  beforeEach(() => {
    state.role = 'RENTER'
    vi.clearAllMocks()
  })

  it.each(['list', 'detail'] as const)(
    'allows a RENTER to open the %s page through its route guard',
    async (route) => {
      const page =
        route === 'list' ? (
          <ChargesRoute />
        ) : (
          await ChargeDetailsRoute({ params: Promise.resolve({ id: 'charge-1' }) })
        )
      render(page)
      expect(
        screen.getByText(
          route === 'list' ? 'Lista de cobranças permitidas' : 'Detalhe da cobrança permitida',
        ),
      ).toBeVisible()
      expect(state.replace).not.toHaveBeenCalled()
    },
  )

  it.each(['list', 'detail'] as const)('keeps AGENT blocked on the %s page', async (route) => {
    state.role = 'AGENT'
    const page =
      route === 'list' ? (
        <ChargesRoute />
      ) : (
        await ChargeDetailsRoute({ params: Promise.resolve({ id: 'charge-1' }) })
      )
    render(page)
    expect(screen.queryByText(/cobranças? permitid/)).not.toBeInTheDocument()
    expect(state.replace).toHaveBeenCalledWith('/dashboard')
  })

  it('keeps the agency financial summary unavailable to RENTER', () => {
    render(<FinancialRoute />)
    expect(screen.queryByText('Resumo financeiro da imobiliária')).not.toBeInTheDocument()
    expect(state.replace).toHaveBeenCalledWith('/dashboard')
  })
})
