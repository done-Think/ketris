import { createTranslator } from 'next-intl'

import { defaultTimeZone } from '@/i18n/formats'
import en from '@/i18n/messages/en-US/face_check.json'
import es from '@/i18n/messages/es-ES/face_check.json'
import pt from '@/i18n/messages/pt-BR/face_check.json'
import type { AppLocale } from '@/i18n/types/locale.types'

const messages = {
  'pt-BR': pt.emailInvitation,
  'en-US': en.emailInvitation,
  'es-ES': es.emailInvitation,
}
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
    .replace(/'/g, '&#39;')
}

function normalizedText(value: string): string {
  return Array.from(value, (character) => (isControlCharacter(character) ? ' ' : character))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function isControlCharacter(value: string): boolean {
  const code = value.charCodeAt(0)
  return code < 32 || code === 127
}

function invitationUrl(value: string): string {
  const raw = value.trim()
  if (Array.from(value).some(isControlCharacter) || !/^https?:\/\//i.test(raw))
    throw new Error('Invalid verification invitation URL')
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('Invalid verification invitation URL')
  }
  const authority = raw.slice(raw.indexOf('://') + 3).split(/[/?#]/, 1)[0]
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (
    url.username ||
    url.password ||
    authority.includes('@') ||
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback))
  )
    throw new Error('Invalid verification invitation URL')
  return url.href
}

export function buildFaceCheckInvitationEmail(input: {
  locale: AppLocale
  personName: string
  agencyName: string
  captureUrl: string
  expiresAt: string
}): { subject: string; text: string; html: string } {
  if (!Object.hasOwn(messages, input.locale))
    throw new Error('Unsupported verification invitation locale')
  const t = createTranslator({ locale: input.locale, messages: messages[input.locale] })
  const url = invitationUrl(input.captureUrl)
  const expiresAt = new Date(input.expiresAt)
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      input.expiresAt,
    ) ||
    !Number.isFinite(expiresAt.getTime())
  )
    throw new Error('Invalid verification invitation expiry')
  const date = new Intl.DateTimeFormat(input.locale, {
    timeZone: defaultTimeZone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(expiresAt)
  const firstName = normalizedText(input.personName).split(' ')[0]
  const agency = normalizedText(input.agencyName) || t('agencyFallback')
  const greeting = firstName ? t('greeting', { name: firstName }) : t('greetingGeneric')
  const intro = t('intro', { agency })
  const expiry = t('expires', { date })
  const subject = t('subject')
  if (subject.includes('\r') || subject.includes('\n'))
    throw new Error('Invalid verification invitation subject')
  const text = [
    'Ketris',
    greeting,
    intro,
    t('guidance'),
    `${t('cta')}: ${url}`,
    expiry,
    t('security'),
    `${t('fallback')}\n${url}`,
    t('ignore'),
    t('team'),
  ].join('\n\n')
  const href = escapeHtml(url)
  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(input.locale)}">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0; padding:32px 16px; background-color:${colors.page}; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${colors.card}; border-radius:12px; border-top:4px solid ${colors.accent};">
          <tr><td style="padding:32px;">
            <p style="margin:0 0 24px; color:${colors.accent}; font-size:22px; font-weight:700;">Ketris</p>
            <h1 style="margin:0 0 20px; color:${colors.title}; font-size:24px;">${escapeHtml(t('title'))}</h1>
            <p style="margin:0 0 12px; color:${colors.body}; font-size:15px; line-height:1.6;">${escapeHtml(greeting)}</p>
            <p style="margin:0 0 16px; color:${colors.body}; font-size:15px; line-height:1.6;">${escapeHtml(intro)}</p>
            <p style="margin:0 0 24px; color:${colors.body}; font-size:15px; line-height:1.6;">${escapeHtml(t('guidance'))}</p>
            <p style="margin:0 0 24px;"><a href="${href}" style="display:inline-block; padding:12px 24px; border-radius:8px; background-color:${colors.accent}; color:#FFFFFF; font-weight:700; text-decoration:none;">${escapeHtml(t('cta'))}</a></p>
            <p style="margin:0 0 12px; color:${colors.muted}; font-size:13px; line-height:1.6;">${escapeHtml(expiry)}</p>
            <p style="margin:0 0 20px; color:${colors.muted}; font-size:13px; line-height:1.6;">${escapeHtml(t('security'))}</p>
            <p style="margin:0 0 8px; color:${colors.muted}; font-size:13px; line-height:1.6;">${escapeHtml(t('fallback'))}</p>
            <p style="margin:0 0 24px; word-break:break-all; font-size:13px;"><a href="${href}" style="color:${colors.accent};">${href}</a></p>
            <p style="margin:0 0 24px; color:${colors.muted}; font-size:13px; line-height:1.6;">${escapeHtml(t('ignore'))}</p>
            <p style="margin:0; color:${colors.title}; font-size:15px; font-weight:700;">${escapeHtml(t('team'))}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
  return { subject, text, html }
}
