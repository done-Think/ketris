import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { InstagramPostEditor } from '@shared/components/integrations/InstagramPostEditor'

function Editor() {
  const [selected, setSelected] = useState([
    'https://example.com/first.jpg',
    'https://example.com/second.jpg',
  ])
  const [caption, setCaption] = useState('Reviewed caption')
  return (
    <InstagramPostEditor
      images={[
        'https://example.com/first.jpg',
        'https://example.com/second.jpg',
        'https://example.com/third.jpg',
      ]}
      selected={selected}
      caption={caption}
      onSelectionChange={setSelected}
      onCaptionChange={setCaption}
    />
  )
}

describe('Instagram publication review', () => {
  it('keeps the full editable caption and allows photo selection before confirming', async () => {
    const user = userEvent.setup()
    render(<Editor />)
    await user.clear(screen.getByRole('textbox', { name: 'Legenda' }))
    await user.type(screen.getByRole('textbox', { name: 'Legenda' }), 'Final caption')
    await user.click(screen.getByRole('checkbox', { name: 'Selecionar' }))
    expect(screen.getByRole('textbox', { name: 'Legenda' })).toHaveValue('Final caption')
    expect(
      screen.getAllByRole('checkbox').filter((input) => (input as HTMLInputElement).checked),
    ).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Confirmar publicação' })).not.toBeInTheDocument()
  })
  it('reorders the selected photos without dropping their selection', async () => {
    const user = userEvent.setup()
    render(<Editor />)
    await user.click(screen.getAllByRole('button', { name: 'Mover foto para depois' })[0])
    expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', 'https://example.com/second.jpg')
    expect(screen.getByRole('checkbox', { name: 'Foto 1' })).toBeChecked()
  })
})
