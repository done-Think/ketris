import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTheme, ThemeProvider } from '@mui/material'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'
import { PropertiesDashboardPage } from '../../components/PropertiesDashboardPage'
import { usePropertyPage } from '../../hooks/use-properties'
import { editableProperty } from '../fixtures/editable-property'

vi.mock('../../hooks/use-properties', () => ({
  usePropertyPage: vi.fn(),
  useDeleteProperty: () => ({ isPending: false, mutateAsync: vi.fn() }),
  usePublishProperty: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUnpublishProperty: () => ({ isPending: false, mutateAsync: vi.fn() }),
}))
vi.mock('@shared/hooks/use-dashboard-agenda-notifications', () => ({
  useDashboardAgendaNotifications: () => [],
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { role: 'OWNER', user: { id: 'owner' }, tenantId: 'tenant' } }),
}))

describe('property table navigation', () => {
  beforeEach(() => {
    vi.mocked(usePropertyPage).mockReturnValue({
      data: {
        properties: [editableProperty],
        pagination: { page: 1, pageSize: 5, total: 12, totalPages: 3 },
        counts: { DRAFT: 12, PUBLISHED: 0, SOLD: 0, RENTED: 0, INACTIVE: 0 },
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePropertyPage>)
  })

  it('requests another server page and resets pagination when sorting a column', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider theme={theme}>
        <PropertiesDashboardPage />
      </ThemeProvider>,
    )
    expect(usePropertyPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, pageSize: 5, locale: 'pt-BR' }),
    )
    await user.click(screen.getByRole('button', { name: /next page|próxima página/i }))
    await waitFor(() =>
      expect(usePropertyPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, pageSize: 5 }),
      ),
    )
    await user.click(screen.getByRole('columnheader', { name: /^Tipo/ }))
    await waitFor(() =>
      expect(usePropertyPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, sortBy: 'type', sortOrder: 'asc', locale: 'pt-BR' }),
      ),
    )
  })

  it('requests the selected page size from the server', async () => {
    const user = userEvent.setup()
    // jsdom evaluates media types, but not viewport widths. Render the desktop controls.
    const desktopTheme = createTheme(theme)
    desktopTheme.breakpoints.up = () => '@media screen'
    render(
      <ThemeProvider theme={desktopTheme}>
        <PropertiesDashboardPage />
      </ThemeProvider>,
    )
    await user.click(screen.getByRole('combobox', { name: /Linhas por página/ }))
    await user.click(screen.getByRole('option', { name: '10' }))
    await waitFor(() =>
      expect(usePropertyPage).toHaveBeenLastCalledWith(expect.objectContaining({ pageSize: 10 })),
    )
  })
})
