'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <h2>Algo deu errado.</h2>
        <p>Nossa equipe foi notificada. Tente novamente em instantes.</p>
      </body>
    </html>
  )
}
