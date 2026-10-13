import { createTranslator } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import type { SendEmailInput } from '@server/shared/email/mailer.port'
import { PASSWORD_RESET_CODE_TTL_MINUTES } from '../domain/password-reset-code'

async function loadAuthMessages(locale: AppLocale) {
  const messages = await import(`@/i18n/messages/${locale}/auth.json`)
  return messages.default
}

const logoUrl = 'https://www.ketris.com.br/email/ketris-logo.png'

const colors = {
  pageBackground: '#F7F8FA',
  cardBackground: '#FFFFFF',
  codeBoxBackground: '#0D0F14',
  accent: '#F30274',
  title: '#212631',
  body: '#505C6F',
  muted: '#617086',
  noticeBackground: '#F7F8FA',
  noticeBorder: '#AFB1B5',
  divider: '#E5E7EB',
}

export async function buildPasswordResetEmail(
  code: string,
  locale: AppLocale,
): Promise<Omit<SendEmailInput, 'to'>> {
  const messages = await loadAuthMessages(locale)
  const t = createTranslator({ locale, messages, namespace: 'passwordResetEmail' })
  const minutes = PASSWORD_RESET_CODE_TTL_MINUTES

  const subject = t('subject')
  const text = [
    t('greeting'),
    t('intro'),
    `${t('codeLabel')}: ${code}`,
    t('instructions', { minutes }),
    t('noticeTitle'),
    t('noticeBody'),
    t('signOff'),
    t('team'),
  ].join(' ')

  const html = `
<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background-color:${colors.pageBackground}; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${colors.pageBackground}; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${colors.cardBackground}; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="background-color:${colors.accent}; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:24px 32px; border-bottom:1px solid ${colors.divider};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" valign="middle">
                      <img src="${logoUrl}" alt="Ketris" height="28" style="display:block; height:28px;" />
                    </td>
                    <td align="right" valign="middle" style="color:${colors.muted}; font-size:13px;">
                      ${t('eyebrow')}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 20px; color:${colors.title}; font-size:24px; font-weight:800;">
                  ${t('title')}
                </h1>
                <p style="margin:0 0 12px; color:${colors.body}; font-size:15px; line-height:1.6;">
                  ${t('greeting')}
                </p>
                <p style="margin:0 0 24px; color:${colors.body}; font-size:15px; line-height:1.6;">
                  ${t('intro')}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${colors.codeBoxBackground}; border-radius:12px; margin:0 0 24px;">
                  <tr>
                    <td align="center" style="padding:24px;">
                      <p style="margin:0 0 8px; color:${colors.muted}; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase;">
                        ${t('codeLabel')}
                      </p>
                      <p style="margin:0; color:${colors.accent}; font-size:36px; font-weight:800; letter-spacing:8px;">
                        ${code}
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 24px; color:${colors.body}; font-size:15px; line-height:1.6;">
                  ${t('instructions', { minutes })}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${colors.noticeBackground}; border:1px solid ${colors.noticeBorder}; border-radius:8px; margin:0 0 24px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0 0 4px; color:${colors.title}; font-size:14px; font-weight:700;">
                        ${t('noticeTitle')}
                      </p>
                      <p style="margin:0; color:${colors.muted}; font-size:13px; line-height:1.5;">
                        ${t('noticeBody')}
                      </p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0; color:${colors.body}; font-size:15px; line-height:1.6;">
                  ${t('signOff')}<br />
                  <strong style="color:${colors.title};">${t('team')}</strong>
                </p>
              </td>
            </tr>
          </table>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
            <tr>
              <td align="center" style="padding:20px 32px; color:${colors.muted}; font-size:12px; line-height:1.6;">
                ${t('footerCompany')}<br />
                ${t('footerDisclaimer')}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

  return { subject, html, text }
}
