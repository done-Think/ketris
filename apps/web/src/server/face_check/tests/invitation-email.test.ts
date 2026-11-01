import { describe, expect, it } from 'vitest'

import { buildFaceCheckInvitationEmail } from '../notifications/invitation-email'

const input = {
  locale: 'pt-BR' as const,
  personName: 'Ana Maria Silva',
  agencyName: 'Imobiliária Horizonte',
  captureUrl: 'https://app.ketris.test/pt/face_check/verify/secure-token',
  expiresAt: '2026-11-02T01:30:00.000Z',
}

describe('Face Check invitation email', () => {
  it.each([
    ['pt-BR', 'Iniciar verificação', 'Olá, Ana.', '1 de novembro de 2026', '22:30'],
    ['en-US', 'Start verification', 'Hello, Ana.', 'November 1, 2026', '10:30'],
    ['es-ES', 'Iniciar verificación', 'Hola, Ana.', '1 de noviembre de 2026', '22:30'],
  ] as const)(
    'renders a branded invitation in %s using the real expiry in the application time zone',
    (locale, cta, greeting, date, time) => {
      const result = buildFaceCheckInvitationEmail({ ...input, locale })
      expect(result.subject).toContain('Ketris')
      expect(result.text).toContain(greeting)
      expect(result.text).toContain(input.agencyName)
      expect(result.text).toContain(`${cta}: ${input.captureUrl}`)
      expect(result.text).toContain(date)
      expect(result.text).toContain(time)
      expect(result.html).toContain(`lang="${locale}"`)
      expect(result.html).toContain('#F30274')
      const document = new DOMParser().parseFromString(result.html, 'text/html')
      expect(document.querySelector('h1')).not.toBeNull()
      expect(Array.from(document.querySelectorAll('a')).map((link) => link.textContent)).toEqual([
        cta,
        input.captureUrl,
      ])
      expect(
        Array.from(document.querySelectorAll('a')).map((link) => link.getAttribute('href')),
      ).toEqual([input.captureUrl, input.captureUrl])
      expect(result.text).not.toContain('Maria Silva')
    },
  )

  it('uses a professional generic greeting if no first name is available', () => {
    const result = buildFaceCheckInvitationEmail({ ...input, personName: '   ' })
    expect(result.text).toContain('\n\nOlá.\n\n')
    expect(result.text).not.toContain('Olá, .')
  })

  it('escapes names and agency data rather than interpreting their HTML', () => {
    const result = buildFaceCheckInvitationEmail({
      ...input,
      personName: '<img/src=x/onerror=alert(1)> Silva',
      agencyName: '<script>alert("agency")</script> & \'broker\'',
    })
    expect(result.html).toContain('&lt;img/src=x/onerror=alert(1)&gt;')
    expect(result.html).toContain(
      '&lt;script&gt;alert(&quot;agency&quot;)&lt;/script&gt; &amp; &#39;broker&#39;',
    )
    const document = new DOMParser().parseFromString(result.html, 'text/html')
    expect(document.querySelector('script, img, [onerror]')).toBeNull()
  })

  it('escapes URL attributes while keeping a usable plain-text fallback', () => {
    const url = 'https://app.ketris.test/pt/face_check/verify/token?one=1&label=%22%3E%3Cscript%3E'
    const result = buildFaceCheckInvitationEmail({ ...input, captureUrl: url })
    expect(result.text).toContain(url)
    expect(result.html).toContain('?one=1&amp;label=')
    const document = new DOMParser().parseFromString(result.html, 'text/html')
    for (const link of document.querySelectorAll('a')) expect(link.getAttribute('href')).toBe(url)
    expect(document.querySelector('script, [onmouseover]')).toBeNull()
  })

  it('keeps the subject static and free of personal data or injected headers', () => {
    const original = buildFaceCheckInvitationEmail(input)
    const result = buildFaceCheckInvitationEmail({
      ...input,
      personName: 'Ana\r\nBcc: evil@example.test',
      agencyName: 'Agency\r\nCc: injected@example.test',
    })
    expect(result.subject).toBe(original.subject)
    expect(result.subject).not.toMatch(/[\r\n]/)
    expect(result.subject).not.toContain('Ana')
    expect(result.subject).not.toContain('evil@example.test')
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    '//app.ketris.test/capture',
    'http://app.ketris.test/capture',
    'https://user:password@app.ketris.test/capture',
    'https://user@app.ketris.test/capture',
    'https://@app.ketris.test/capture',
    'https://app.ketris.test/capture\r\nBcc:evil@example.test',
  ])('rejects an unsafe invitation URL: %s', (captureUrl) => {
    expect(() => buildFaceCheckInvitationEmail({ ...input, captureUrl })).toThrow(
      'Invalid verification invitation URL',
    )
  })

  it.each([
    'http://localhost:3125/pt/face_check/verify/token',
    'http://127.0.0.1:3125/pt/face_check/verify/token',
    'http://[::1]:3125/pt/face_check/verify/token',
  ])('allows worker-approved loopback URLs: %s', (captureUrl) => {
    expect(buildFaceCheckInvitationEmail({ ...input, captureUrl }).text).toContain(captureUrl)
  })

  it.each(['not-a-date', '2026-99-99T99:99:99Z', '2026-11-02'])(
    'rejects an invalid expiry rather than inventing a deadline: %s',
    (expiresAt) => {
      expect(() => buildFaceCheckInvitationEmail({ ...input, expiresAt })).toThrow(
        'Invalid verification invitation expiry',
      )
    },
  )
})
