import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ContactFormDialog } from '../../components/contacts-list/ContactFormDialog'
import type { ContactFormValues } from '../../schemas/contact-schema'

const initialValues: ContactFormValues = {
  name: 'Maria Silva',
  email: 'maria@example.com',
  phone: '(11) 90000-0000',
  type: 'PROPRIETARIO',
  notes: 'Cliente antiga',
}

describe('ContactFormDialog', () => {
  it('renders the create title with empty fields when there are no initial values', () => {
    render(
      <ContactFormDialog
        open
        initialValues={null}
        isPending={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Novo contato' })).toBeVisible()
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('')
  })

  it('renders the edit title pre-filled with the initial values', () => {
    render(
      <ContactFormDialog
        open
        initialValues={initialValues}
        isPending={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Editar contato' })).toBeVisible()
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('Maria Silva')
    expect(screen.getByLabelText(/^E-mail/)).toHaveValue('maria@example.com')
  })

  it('validates required fields and calls onSave with the trimmed form values', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(
      <ContactFormDialog
        open
        initialValues={null}
        isPending={false}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('E-mail invalido.')).toBeVisible()
    expect(onSave).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText(/^Nome/), 'Joao Souza')
    await user.type(screen.getByLabelText(/^E-mail/), 'joao@example.com')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSave.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ name: 'Joao Souza', email: 'joao@example.com' }),
    )
  })

  it('disables actions while pending', () => {
    render(
      <ContactFormDialog open initialValues={null} isPending onClose={vi.fn()} onSave={vi.fn()} />,
    )

    const dialog = screen.getByRole('dialog')
    const buttons = within(dialog).getAllByRole('button')

    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toBeDisabled()
    expect(buttons[1]).toBeDisabled()
  })
})
