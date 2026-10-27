import { createTranslator } from 'next-intl'

import type { AppLocale } from '@/i18n/types/locale.types'
import type { SendEmailInput } from '@server/shared/email/mailer.port'

import { TEAM_INVITATION_TTL_DAYS } from '../domain/team-invitation-token'

const colors = {
  page: '#F7F8FA',
  card: '#FFFFFF',
  accent: '#F30274',
  title: '#212631',
  body: '#505C6F',
  muted: '#617086',
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function buildTeamInvitationEmail(input: {
  locale: AppLocale
  link: string
  brokerName: string
  agencyName: string
  inviterName: string
}): Promise<Omit<SendEmailInput, 'to'>> {
  const messages = (await import(`@/i18n/messages/${input.locale}/dashboard.json`)).default
  const t = createTranslator({
    locale: input.locale,
    messages,
    namespace: 'team.invitationEmail',
  })
  const values = {
    name: input.brokerName,
    agency: input.agencyName,
    inviter: input.inviterName,
    days: TEAM_INVITATION_TTL_DAYS,
  }
  const subject = t('subject', values)
  const text = [
    t('greeting', values),
    t('intro', values),
    `${t('cta')}: ${input.link}`,
    t('expires', values),
    t('ignore'),
    t('team'),
  ].join('\n\n')
  const html = `<!DOCTYPE html>
<html lang="${input.locale}">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0; padding:32px 16px; background-color:${colors.page}; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${colors.card}; border-radius:12px; border-top:4px solid ${colors.accent};">
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 20px; color:${colors.title}; font-size:24px;">${escapeHtml(t('title', values))}</h1>
            <p style="margin:0 0 12px; color:${colors.body}; font-size:15px; line-height:1.6;">${escapeHtml(t('greeting', values))}</p>
            <p style="margin:0 0 24px; color:${colors.body}; font-size:15px; line-height:1.6;">${escapeHtml(t('intro', values))}</p>
            <p style="margin:0 0 24px;"><a href="${escapeHtml(input.link)}" style="display:inline-block; padding:12px 24px; border-radius:8px; background-color:${colors.accent}; color:#FFFFFF; font-weight:700; text-decoration:none;">${escapeHtml(t('cta'))}</a></p>
            <p style="margin:0 0 12px; color:${colors.muted}; font-size:13px;">${escapeHtml(t('expires', values))}</p>
            <p style="margin:0 0 24px; color:${colors.muted}; font-size:13px;">${escapeHtml(t('ignore'))}</p>
            <p style="margin:0; color:${colors.title}; font-size:15px; font-weight:700;">${escapeHtml(t('team'))}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`

  return { subject, html, text }
}
