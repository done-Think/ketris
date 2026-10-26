import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { ConvertLeadDialog } from '../../components/ConvertLeadDialog'
import { useConvertLeadToOpportunity } from '../../hooks/use-leads'
import type { DashboardLead } from '../../types/lead'
import { property } from '../fixtures/property'

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}))

vi.mock('../../hooks/use-leads', () => ({
  useConvertLeadToOpportunity: vi.fn(),
}))

vi.mock('../../components/opportunity-detail/PropertyAutocomplete', () => ({
  PropertyAutocomplete: ({
    onChange,
  }: {
    onChange: (property: typeof import('../fixtures/property').property) => void
  }) => (
    <button type="button" onClick={() => onChange(property)}>
      Selecionar imóvel
    </button>
  ),
}))

const lead: DashboardLead = {
  id: 'lead-1',
  name: 'Theodoro Teles',
  budget: '350.000,00',
  phone: '(11) 98820-1400',
  email: 'theodoro@example.com',
  lastContact: 'agora',
  lastContactAt: '2026-10-07T12:00:00.000Z',
  interest: 'Casa residencial',
  source: 'Marketplace',
  broker: 'Thiago Santos',
  stage: 'PROPOSTA',
  opportunityId: null,
}

function renderDialog() {
  return render(
    <ThemeProvider theme={theme}>
      <ConvertLeadDialog lead={lead} open onClose={vi.fn()} />
    </ThemeProvider>,
  )
}

describe('ConvertLeadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSession).mockReturnValue({
      data: { tenantId: 'tenant-1' },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>)
    vi.mocked(useConvertLeadToOpportunity).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useConvertLeadToOpportunity>)
  })

  it('preserves cents and submits the selected property and email', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn()
    vi.mocked(useConvertLeadToOpportunity).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useConvertLeadToOpportunity>)
    renderDialog()

    fireEvent.change(screen.getByLabelText('Valor proposto'), {
      target: { value: '365000000.25' },
    })
    await user.click(screen.getByRole('button', { name: 'Selecionar imóvel' }))

    expect(screen.getByLabelText('Valor proposto')).toHaveValue(365000000.25)

    await user.click(screen.getByRole('button', { name: 'Converter' }))

    expect(mutate).toHaveBeenCalledWith(
      {
        leadId: 'lead-1',
        payload: {
          propertyId: 'property-1',
          proposedValue: 365000000.25,
          email: lead.email,
        },
      },
      expect.anything(),
    )
  })
})
