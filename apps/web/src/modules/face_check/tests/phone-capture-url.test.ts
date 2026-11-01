import { expect, it } from 'vitest'
import { phoneCaptureUrl } from '../utils/phone-capture-url'

const token = 'a'.repeat(64)
it('shares the portable invitation when capture is inside the authenticated dashboard', () => {
  expect(
    phoneCaptureUrl(
      'https://ketris.example/pt/dashboard/face_check/my-verifications/session?private=value',
      token,
      'pt-BR',
    ),
  ).toBe(`https://ketris.example/pt/face_check/verify/${token}`)
})
it.each([
  ['pt-BR', 'pt'],
  ['en-US', 'en'],
  ['es-ES', 'es'],
] as const)(
  'shares the same invitation in %s without unrelated query parameters',
  (locale, prefix) => {
    expect(
      phoneCaptureUrl('https://ketris.example/something?private=value#details', token, locale),
    ).toBe(`https://ketris.example/${prefix}/face_check/verify/${token}`)
  },
)
it.each([
  'http://ketris.example',
  'https://localhost:3000',
  'https://127.0.0.1',
  'https://[::1]',
  'https://app.localhost',
  'https://user:password@ketris.example',
  'invalid',
])('does not present an unusable or unsafe phone link: %s', (href) => {
  expect(phoneCaptureUrl(href, token, 'pt-BR')).toBeNull()
})
