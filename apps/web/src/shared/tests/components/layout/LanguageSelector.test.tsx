import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LanguageSelector } from '@shared/components/layout/LanguageSelector'
import { theme } from '@shared/theme/theme'

const { state, replace } = vi.hoisted(() => ({
  state: {
    pathname: '/',
    params: {} as Record<string, string | string[]>,
    search: '',
  },
  replace: vi.fn(),
}))

vi.mock('@/i18n/navigation', async () => ({
  ...(await vi.importActual<typeof import('@/i18n/navigation')>('@/i18n/navigation')),
  usePathname: () => state.pathname,
}))
vi.mock('next/navigation', async () => ({
  ...(await vi.importActual<typeof import('next/navigation')>('next/navigation')),
  useParams: () => state.params,
  useSearchParams: () => new URLSearchParams(state.search),
  useRouter: () => ({ replace }),
}))

async function selectLanguage(name: string) {
  const user = userEvent.setup()
  render(
    <ThemeProvider theme={theme}>
      <LanguageSelector variant="header" />
    </ThemeProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'BR' }))
  await user.click(screen.getByRole('menuitem', { name }))
}

describe('LanguageSelector route preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.pathname = '/'
    state.params = {}
    state.search = ''
    window.history.replaceState({}, '', '/')
  })

  it('changes a public agency detail to its translated URL while preserving params, repeated filters and fragment', async () => {
    state.pathname = '/agencies/[id]/[creci]'
    state.params = { locale: 'pt-BR', id: 'canonical-agency', creci: '12345' }
    state.search = 'area=one&area=two'
    window.history.replaceState({}, '', '/#team')

    await selectLanguage('Espanhol')
    expect(document.cookie).toContain('NEXT_LOCALE=es-ES')
    expect(replace).toHaveBeenCalledTimes(1)

    expect(replace).toHaveBeenCalledWith(
      '/es/inmobiliarias/canonical-agency/12345?area=one&area=two#team',
    )
  })

  it('keeps the agenda pathname and selected event when switching to English', async () => {
    state.pathname = '/dashboard/agenda'
    state.search = 'eventId=visit-1'

    await selectLanguage('Inglês')
    expect(replace).toHaveBeenCalledTimes(1)

    expect(replace).toHaveBeenCalledWith('/en/dashboard/agenda?eventId=visit-1')
  })

  it('preserves a broker ID when switching its public detail to English', async () => {
    state.pathname = '/brokers/[id]'
    state.params = { id: 'broker-1' }

    await selectLanguage('Inglês')
    expect(replace).toHaveBeenCalledTimes(1)

    expect(replace).toHaveBeenCalledWith('/en/brokers/broker-1')
  })
})
