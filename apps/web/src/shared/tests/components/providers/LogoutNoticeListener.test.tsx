import { act, render, screen } from '@testing-library/react'
import { SnackbarProvider } from 'notistack'
import { describe, expect, it } from 'vitest'

import { LogoutNoticeListener } from '@shared/components/providers/LogoutNoticeListener'
import { notifyLocalOnlyLogout } from '@shared/lib/auth/session-lifecycle'

function renderListener() {
  return render(
    <SnackbarProvider>
      <LogoutNoticeListener />
    </SnackbarProvider>,
  )
}

describe('LogoutNoticeListener', () => {
  it('tells the user the session ended only on this device', async () => {
    renderListener()
    act(() => notifyLocalOnlyLogout())
    expect(await screen.findByText(/sessão encerrada apenas neste dispositivo/i)).toBeVisible()
  })

  it('shows nothing until a local-only logout happens and stops listening on unmount', () => {
    const view = renderListener()
    expect(screen.queryByText(/apenas neste dispositivo/i)).not.toBeInTheDocument()
    view.unmount()
    act(() => notifyLocalOnlyLogout())
    expect(screen.queryByText(/apenas neste dispositivo/i)).not.toBeInTheDocument()
  })
})
