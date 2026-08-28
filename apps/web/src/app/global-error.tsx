'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

const globalErrorMessages = {
  'pt-BR': {
    lang: 'pt-BR',
    title: 'Algo deu errado.',
    description: 'Nossa equipe foi notificada. Tente novamente em instantes.',
  },
  'en-US': {
    lang: 'en-US',
    title: 'Something went wrong.',
    description: 'Our team has been notified. Please try again shortly.',
  },
  'es-ES': {
    lang: 'es-ES',
    title: 'Algo salió mal.',
    description: 'Nuestro equipo fue notificado. Inténtalo nuevamente en unos instantes.',
  },
} as const

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  const locale = getBrowserLocale()
  const message = globalErrorMessages[locale]

  return (
    <html lang={message.lang}>
      <body>
        <h2>{message.title}</h2>
        <p>{message.description}</p>
      </body>
    </html>
  )
}

function getBrowserLocale(): keyof typeof globalErrorMessages {
  if (typeof navigator === 'undefined') return 'pt-BR'

  const [language] = navigator.languages.length ? navigator.languages : [navigator.language]

  if (language?.startsWith('en')) return 'en-US'
  if (language?.startsWith('es')) return 'es-ES'

  return 'pt-BR'
}
