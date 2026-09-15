import { ThemeProvider } from '@mui/material'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { LeadContactDialog } from '../../components/LeadContactDialog'
import type { DashboardLead } from '../../types/lead'

const lead: DashboardLead = {
  id: 'lead-001',
  name: 'João Silva',
  budget: 'R$ 4.5M',
  phone: '(11) 99984-3021',
  email: 'joao.silva@email.com',
  lastContact: 'Há 30 min',
  interest: 'Apartamento 3 quartos nos Jardins',
  source: 'Marketplace',
  broker: 'Roberto Souza',
  stage: 'Novo',
}

function renderDialog(overrides: Partial<ComponentProps<typeof LeadContactDialog>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <LeadContactDialog lead={lead} open onClose={vi.fn()} {...overrides} />
    </ThemeProvider>,
  )
}

describe('LeadContactDialog', () => {
  it('renders nothing when there is no selected lead', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <LeadContactDialog lead={null} open onClose={vi.fn()} />
      </ThemeProvider>,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the lead's name, phone and email", () => {
    renderDialog()

    expect(screen.getByText('João Silva')).toBeVisible()
    expect(screen.getByText('(11) 99984-3021')).toBeVisible()
    expect(screen.getByText('joao.silva@email.com')).toBeVisible()
  })

  it('links call, email and whatsapp actions to the right destinations', () => {
    renderDialog()

    expect(screen.getByRole('link', { name: 'Ligar' })).toHaveAttribute('href', 'tel:11999843021')
    expect(screen.getByRole('link', { name: 'E-mail' })).toHaveAttribute(
      'href',
      'mailto:joao.silva@email.com',
    )
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/5511999843021',
    )
  })

  it('does not duplicate the Brazil country code for a phone that already has it', () => {
    renderDialog({ lead: { ...lead, phone: '(55 11) 99984-3021' } })

    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/5511999843021',
    )
  })

  it('calls onClose from the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderDialog({ onClose })

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
