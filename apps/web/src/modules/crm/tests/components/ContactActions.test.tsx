import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { theme } from '@shared/theme/theme'
import { ContactActions } from '../../components/contacts-list/ContactActions'
import type { ContactActionsProps, ContactListItem } from '../../types/contact'

const contact: ContactListItem = {
  id: 'contact',
  name: 'Customer',
  type: 'RENTER',
  phone: '(55) 99999-0000',
  email: 'customer@example.invalid',
  lastInteraction: '',
  propertyCount: 0,
  avatarUrl: '',
}

const renderActions = (props: Partial<ContactActionsProps> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ContactActions contact={contact} {...props} />
    </ThemeProvider>,
  )

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Mais opções para Customer' }))
  return screen.getByRole('menu')
}

describe('Contact actions menu', () => {
  it.each([
    ['Ligar', 'PHONE', 'tel:55999990000'],
    ['WhatsApp', 'WHATSAPP', 'https://wa.me/5555999990000'],
    ['E-mail', 'EMAIL', `mailto:${contact.email}`],
  ] as const)(
    'offers %s from the menu and records only the chosen channel',
    async (label, channel, href) => {
      const user = userEvent.setup()
      const action = vi.fn(() => true)
      renderActions({ onContactAction: action })
      const menu = await openMenu(user)
      expect(action).not.toHaveBeenCalled()
      const item = within(menu).getByRole('menuitem', { name: label })
      expect(item).toHaveAttribute('href', href)
      expect(item.querySelector('svg')).not.toBeNull()
      item.addEventListener('click', (event) => event.preventDefault())
      fireEvent.click(item)
      expect(action).toHaveBeenCalledTimes(1)
      expect(action).toHaveBeenCalledWith(contact, channel)
    },
  )

  it('opens WhatsApp in a new tab', async () => {
    const user = userEvent.setup()
    renderActions()
    const menu = await openMenu(user)
    const item = within(menu).getByRole('menuitem', { name: 'WhatsApp' })
    expect(item).toHaveAttribute('target', '_blank')
    expect(item).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows icons on the add-lead and archive items', async () => {
    const user = userEvent.setup()
    renderActions({ onAddLead: vi.fn(), onOpenMoreOptions: vi.fn() })
    const menu = await openMenu(user)
    for (const name of ['Adicionar Customer a Leads', 'Arquivar Customer']) {
      expect(within(menu).getByRole('menuitem', { name }).querySelector('svg')).not.toBeNull()
    }
  })

  it('allows closing the menu without creating a contact attempt', async () => {
    const user = userEvent.setup()
    const action = vi.fn(() => true)
    renderActions({ onContactAction: action })
    await openMenu(user)
    await user.keyboard('{Escape}')
    expect(action).not.toHaveBeenCalled()
  })

  it('hides shortcuts without destination data', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider theme={theme}>
        <ContactActions contact={{ ...contact, phone: '' }} onOpenMoreOptions={vi.fn()} />
      </ThemeProvider>,
    )
    const menu = await openMenu(user)
    expect(within(menu).queryByRole('menuitem', { name: 'Ligar' })).not.toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: 'WhatsApp' })).not.toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'E-mail' })).toBeVisible()
  })

  it('disables the menu when the contact has no options', () => {
    renderActions({ contact: { ...contact, phone: '', email: '' } })
    expect(screen.getByRole('button', { name: 'Mais opções para Customer' })).toBeDisabled()
  })
})
