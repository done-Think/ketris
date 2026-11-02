import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { SessionRecoveryProvider as AppSessionProvider } from '@shared/components/providers/SessionRecoveryProvider'
import { notifySessionEndRequested } from '@shared/lib/auth/session-lifecycle'
import type { Session } from 'next-auth'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const owner: Session = {
  user: { id: 'owner', name: 'Agency', email: 'owner@example.test' },
  expires: '2099-01-01T00:00:00Z',
  scope: 'tenant',
  tenantId: 'agency',
  role: 'OWNER',
  accessToken: 'owner-access',
  refreshToken: 'owner-refresh',
}
const fetchMock = vi.fn()
function Probe() {
  const { data, status, update } = useSession()
  return (
    <>
      <div>
        {data?.authUnavailable
          ? 'temporarily-unavailable'
          : `${status}:${data?.user?.id ?? 'none'}`}
      </div>
      <output data-testid="tokens">
        {[data?.accessToken, data?.refreshToken, data?.scope, data?.tenantId]
          .map((value) => value ?? 'none')
          .join(':')}
      </output>
      <button onClick={() => void update()}>Retry session</button>
      <input aria-label="Unsaved draft" defaultValue="initial" />
    </>
  )
}
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

it('does not interpret a failed session revalidation on return to the window as a logout', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 503,
    json: async () => ({ error: 'unavailable' }),
  })
  render(
    <AppSessionProvider session={owner}>
      <Probe />
    </AppSessionProvider>,
  )
  expect(screen.getByText('authenticated:owner')).toBeVisible()
  fireEvent(document, new Event('visibilitychange'))
  await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  expect(await screen.findByText('temporarily-unavailable')).toBeVisible()
  expect(screen.getByTestId('tokens')).toHaveTextContent('none:none:none:none')
})

it('recovers the same session after a temporary connection failure', async () => {
  fetchMock.mockImplementation((url) =>
    String(url).endsWith('/_log')
      ? Promise.resolve({ ok: true, json: async () => ({}) })
      : Promise.reject(new TypeError('network unavailable')),
  )
  render(
    <AppSessionProvider session={owner}>
      <Probe />
    </AppSessionProvider>,
  )
  fireEvent.change(screen.getByLabelText('Unsaved draft'), { target: { value: 'keep this work' } })
  fireEvent(document, new Event('visibilitychange'))
  await screen.findByText('temporarily-unavailable')
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => owner })
  fireEvent.click(screen.getByRole('button', { name: 'Retry session' }))
  expect(await screen.findByText('authenticated:owner')).toBeVisible()
  expect(screen.getByTestId('tokens')).toHaveTextContent('owner-access:owner-refresh:tenant:agency')
  expect(screen.getByLabelText('Unsaved draft')).toHaveValue('keep this work')
})

it('accepts a logout only after the session endpoint confirms an empty successful response', async () => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
  render(
    <AppSessionProvider session={owner}>
      <Probe />
    </AppSessionProvider>,
  )
  fireEvent(document, new Event('visibilitychange'))
  expect(await screen.findByText('unauthenticated:none')).toBeVisible()
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('confirms expiration when a retry succeeds after an outage', async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
  render(
    <AppSessionProvider session={owner}>
      <Probe />
    </AppSessionProvider>,
  )
  fireEvent(document, new Event('visibilitychange'))
  await screen.findByText('temporarily-unavailable')
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
  fireEvent.click(screen.getByRole('button', { name: 'Retry session' }))
  expect(await screen.findByText('unauthenticated:none')).toBeVisible()
})

it('honors explicit logout without restoring a cached session', async () => {
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) })
  render(
    <AppSessionProvider session={owner}>
      <Probe />
    </AppSessionProvider>,
  )
  act(() => notifySessionEndRequested())
  fireEvent(document, new Event('visibilitychange'))
  expect(await screen.findByText('unauthenticated:none')).toBeVisible()
  expect(fetchMock).toHaveBeenCalledOnce()
})

it('does not restore credentials explicitly invalidated by the backend', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      user: owner.user,
      expires: owner.expires,
      authUnavailable: false,
    }),
  })
  render(
    <AppSessionProvider session={owner}>
      <Probe />
    </AppSessionProvider>,
  )
  fireEvent(document, new Event('visibilitychange'))
  await waitFor(() => expect(screen.getByTestId('tokens')).toHaveTextContent('none:none:none:none'))
  expect(screen.queryByText('temporarily-unavailable')).not.toBeInTheDocument()
})

it('never restores the previous account after a validated account switch', async () => {
  const candidate: Session = {
    ...owner,
    user: { id: 'candidate' },
    accessToken: 'candidate-access',
    refreshToken: 'candidate-refresh',
    tenantId: 'other',
  }
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => candidate })
  render(
    <AppSessionProvider session={owner}>
      <Probe />
    </AppSessionProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Retry session' }))
  await screen.findByText('authenticated:candidate')
  fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
  fireEvent(document, new Event('visibilitychange'))
  await screen.findByText('temporarily-unavailable')
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => candidate })
  fireEvent.click(screen.getByRole('button', { name: 'Retry session' }))
  expect(await screen.findByText('authenticated:candidate')).toBeVisible()
  expect(screen.getByTestId('tokens')).not.toHaveTextContent('owner-access')
})

it('does not attempt recovery for a visitor who never had an authenticated session', () => {
  render(
    <AppSessionProvider session={null}>
      <Probe />
    </AppSessionProvider>,
  )
  expect(screen.getByText('unauthenticated:none')).toBeVisible()
  expect(fetchMock).not.toHaveBeenCalled()
})
