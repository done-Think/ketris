import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FinancialDashboardPage } from '../../components/FinancialDashboardPage'
import { monthKey, recentMonths } from '../../utils/month'
import { apiListItem, listResponse, summary } from '../fixtures/charge'
import { apiError, renderWithProviders } from '../fixtures/render'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  enqueueSnackbar: vi.fn(),
  session: { user: { id: 'owner' }, tenantId: 'tenant', role: 'OWNER' },
}))
vi.mock('../../services/financial-service', async () => ({
  financialService: (await import('../fixtures/mocks')).financialServiceMock,
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: mocks.session, status: 'authenticated' }),
}))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.enqueueSnackbar }) }))
vi.mock('@/i18n/navigation', async () => ({
  ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
  useRouter: () => ({ push: mocks.push }),
}))
vi.mock('@shared/hooks/use-dashboard-face-check-notifications', () => ({
  useDashboardFaceCheckNotifications: () => [],
}))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))
vi.mock('../../components/FinancialMovementChart', () => ({
  FinancialMovementChart: ({ movement }: { movement: { month: string; revenue: number }[] }) => (
    <div data-testid="movement">{movement.map(({ month }) => month).join(',')}</div>
  ),
}))

const { financialServiceMock: service } = await import('../fixtures/mocks')
const currentMonth = monthKey(new Date())
const previousMonth = recentMonths(new Date(), 2)[1]
const monthLabel = (month: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${month}-01T12:00:00Z`),
  )

beforeEach(() => {
  vi.resetAllMocks()
  service.getSummary.mockResolvedValue(
    summary({
      upcomingDues: [
        {
          id: 'due-1',
          code: 'COB-2026-0009',
          description: null,
          payerName: 'Carlos',
          propertyId: 'property-9',
          propertyTitle: 'Casa Morumbi',
          dueDate: '2026-10-30T00:00:00.000Z',
          amount: 9200,
          status: 'PENDING',
        },
      ],
    }),
  )
  service.listCharges.mockResolvedValue(listResponse([apiListItem()]))
})

describe('FinancialDashboardPage', () => {
  it('loads the summary and entries of the current month in BRL', async () => {
    renderWithProviders(<FinancialDashboardPage />)

    expect(
      await screen.findByText('R$ 10.500,50', { normalizer: (v) => v.replace(/\s/g, ' ') }),
    ).toBeVisible()
    expect(screen.getByTestId('movement')).toHaveTextContent('set,out')
    expect(service.getSummary).toHaveBeenCalledWith(currentMonth)
    expect(service.listCharges).toHaveBeenCalledWith({ dueMonth: currentMonth, pageSize: 8 })
  })

  it('reloads summary and entries when another month is chosen', async () => {
    renderWithProviders(<FinancialDashboardPage />)
    await userEvent.click(await screen.findByRole('button', { name: monthLabel(currentMonth) }))
    await userEvent.click(
      within(await screen.findByRole('menu')).getByRole('menuitem', {
        name: monthLabel(previousMonth),
      }),
    )

    await waitFor(() => expect(service.getSummary).toHaveBeenCalledWith(previousMonth))
    expect(service.listCharges).toHaveBeenCalledWith({ dueMonth: previousMonth, pageSize: 8 })
  })

  it('opens the charge detail from an upcoming due', async () => {
    renderWithProviders(<FinancialDashboardPage />)
    await userEvent.click(await screen.findByRole('button', { name: /Casa Morumbi/ }))
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/dashboard/finance/charges/[id]',
      params: { id: 'due-1' },
    })
  })

  it('exports the chosen month and reports failures', async () => {
    service.exportCharges.mockRejectedValue(apiError('FORBIDDEN', 403))
    renderWithProviders(<FinancialDashboardPage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Exportar' }))

    await waitFor(() => expect(service.exportCharges).toHaveBeenCalledWith(currentMonth, 'pt-BR'))
    await waitFor(() =>
      expect(mocks.enqueueSnackbar).toHaveBeenCalledWith('Você não tem permissão para esta ação.', {
        variant: 'error',
      }),
    )
  })
})
