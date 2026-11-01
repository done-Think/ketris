import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardNotificationsButton } from '@shared/components/layout/DashboardNotificationsButton'
import { useDashboardAgendaNotifications } from '@shared/hooks/use-dashboard-agenda-notifications'
import { useDashboardFaceCheckNotifications } from '@shared/hooks/use-dashboard-face-check-notifications'
import type { DashboardNotificationItem } from '@shared/types/dashboard-notification'

const router = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => router }))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: vi.fn(),
}))
vi.mock('@shared/hooks/use-dashboard-face-check-notifications', () => ({
  useDashboardFaceCheckNotifications: vi.fn(),
}))

const faceCheck: DashboardNotificationItem = {
  id: 'pending-verifications',
  kind: 'faceCheckVerification',
  title: 'Verificação pendente',
  message: 'Você tem uma verificação pendente.',
  href: { pathname: '/dashboard/face_check/my-verifications', query: { start: 'next' } },
}
const agenda: DashboardNotificationItem = {
  id: 'agenda',
  kind: 'todayVisit',
  title: 'Visita de hoje',
  message: 'Agenda notification',
  href: { pathname: '/dashboard/agenda', query: { eventId: 'event' } },
}

async function openBell() {
  const button = screen.getByRole('button', { name: 'Abrir notificações' })
  vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
    x: 10,
    y: 10,
    top: 10,
    left: 10,
    right: 52,
    bottom: 52,
    width: 42,
    height: 42,
    toJSON: () => ({}),
  })
  await userEvent.click(button)
}

describe('verification bell integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useDashboardFaceCheckNotifications).mockReturnValue([faceCheck])
    vi.mocked(useDashboardAgendaNotifications).mockReturnValue([agenda])
  })

  it('combines pending verification and agenda notifications, showing verification first', async () => {
    render(<DashboardNotificationsButton placement="navigationHeader" />)
    await openBell()
    const verificationTitle = screen.getByText(faceCheck.title)
    const agendaTitle = screen.getByText(agenda.title)
    expect(verificationTitle).toBeVisible()
    expect(agendaTitle).toBeVisible()
    expect(
      verificationTitle.compareDocumentPosition(agendaTitle) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(useDashboardFaceCheckNotifications).toHaveBeenCalled()
    expect(useDashboardAgendaNotifications).toHaveBeenCalled()
  })

  it('opens the pending capture resolver directly without putting a token in the notification', async () => {
    render(<DashboardNotificationsButton placement="navigationHeader" />)
    await openBell()
    await userEvent.click(screen.getByRole('button', { name: /Verificação pendente/ }))
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/dashboard/face_check/my-verifications',
      query: { start: 'next' },
    })
    expect(JSON.stringify(router.push.mock.calls)).not.toContain('/verify/')
    expect(screen.getByLabelText('Abrir notificações')).not.toHaveAttribute('aria-expanded', 'true')
  })

  it('uses explicit notifications without mounting either default query source', async () => {
    const onSelect = vi.fn()
    render(
      <DashboardNotificationsButton
        placement="navigationHeader"
        notifications={[agenda]}
        onNotificationSelect={onSelect}
      />,
    )
    await openBell()
    expect(screen.queryByText(faceCheck.title)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Visita de hoje/ }))
    expect(onSelect).toHaveBeenCalledWith(agenda)
    expect(router.push).not.toHaveBeenCalled()
    expect(useDashboardFaceCheckNotifications).not.toHaveBeenCalled()
    expect(useDashboardAgendaNotifications).not.toHaveBeenCalled()
  })

  it('supports an explicit empty notification list without a query client', async () => {
    render(<DashboardNotificationsButton placement="navigationHeader" notifications={[]} />)
    await openBell()
    expect(screen.getByText('Nenhum alerta para exibir.')).toBeVisible()
    expect(useDashboardFaceCheckNotifications).not.toHaveBeenCalled()
    expect(useDashboardAgendaNotifications).not.toHaveBeenCalled()
  })
})
