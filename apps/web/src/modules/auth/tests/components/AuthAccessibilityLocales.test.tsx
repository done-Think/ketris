import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { VerificationCodeField } from '../../components/VerificationCodeField'
import { AgencyAutocomplete } from '../../components/AgencyAutocomplete'
import { AuthQueryTestProvider } from '../fixtures/auth-query-provider'

const settings = vi.hoisted(() => ({ locale: 'pt-BR' as 'pt-BR' | 'en-US' | 'es-ES' }))
vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl')
  const messages = {
    'pt-BR': (await import('@/i18n/messages/pt-BR/auth.json')).default,
    'en-US': (await import('@/i18n/messages/en-US/auth.json')).default,
    'es-ES': (await import('@/i18n/messages/es-ES/auth.json')).default,
  }
  return {
    ...actual,
    useTranslations: (namespace: 'auth.verificationCode' | 'auth.registerDetails') =>
      actual.createTranslator({
        locale: settings.locale,
        messages: { auth: messages[settings.locale] },
        namespace,
      }),
  }
})
vi.mock('../../services/registration-service', () => ({
  registrationService: { searchAgencies: vi.fn().mockResolvedValue([]) },
}))
function Code() {
  const { control } = useForm({ defaultValues: { code: '' } })
  return <VerificationCodeField control={control} name="code" label="OTP" />
}

describe('acessibilidade de Auth nos três idiomas', () => {
  it.each([
    ['pt-BR', 'OTP — dígito 1 de 6', 'Abrir opções', 'Fechar opções'],
    ['en-US', 'OTP — digit 1 of 6', 'Open options', 'Close options'],
    ['es-ES', 'OTP — dígito 1 de 6', 'Abrir opciones', 'Cerrar opciones'],
  ] as const)(
    '%s traduz cada dígito e os controles do autocomplete',
    async (locale, digit, open, close) => {
      settings.locale = locale
      const user = userEvent.setup()
      render(
        <AuthQueryTestProvider>
          <Code />
          <AgencyAutocomplete value={null} onChange={vi.fn()} />
        </AuthQueryTestProvider>,
      )
      expect(screen.getByLabelText(digit)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: open }))
      expect(screen.getByRole('button', { name: close })).toBeInTheDocument()
    },
  )
})
