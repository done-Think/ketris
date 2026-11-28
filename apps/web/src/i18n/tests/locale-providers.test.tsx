import { render, screen } from '@testing-library/react'
import { useFormatter } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'

import { LocaleProviders } from '@/app/providers'

import { defaultTimeZone } from '../formats'

vi.unmock('next-intl')

function NamedDateTime() {
  const format = useFormatter()

  return <span>{format.dateTime(new Date('2026-11-27T17:00:00.000Z'), 'weekdayDayTime')}</span>
}

describe('LocaleProviders', () => {
  it('passes the shared named formats to the browser formatter', () => {
    render(
      <LocaleProviders i18n={{ locale: 'pt-BR', messages: {}, timeZone: defaultTimeZone }}>
        <NamedDateTime />
      </LocaleProviders>,
    )

    expect(screen.getByText('sex., 27/11, 14:00')).toBeInTheDocument()
  })
})
