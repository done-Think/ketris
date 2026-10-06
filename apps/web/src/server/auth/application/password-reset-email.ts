import { PASSWORD_RESET_CODE_TTL_MINUTES } from '../domain/password-reset-code'
import type { SendEmailInput } from '@server/shared/email/mailer.port'

export function buildPasswordResetEmail(code: string): Omit<SendEmailInput, 'to'> {
  const subject = 'Seu código de verificação Ketris'
  const text =
    `Seu código de verificação é ${code}. ` +
    `Ele expira em ${PASSWORD_RESET_CODE_TTL_MINUTES} minutos. ` +
    'Se você não pediu essa troca de senha, ignore este e-mail.'
  const html = `
    <div style="font-family: Arial, sans-serif; color: #212631;">
      <p>Seu código de verificação é:</p>
      <p style="font-size: 32px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>Ele expira em ${PASSWORD_RESET_CODE_TTL_MINUTES} minutos.</p>
      <p style="color: #6b7280;">Se você não pediu essa troca de senha, ignore este e-mail.</p>
    </div>
  `

  return { subject, html, text }
}
