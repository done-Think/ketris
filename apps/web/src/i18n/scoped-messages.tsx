import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { selectRouteMessages } from './message-selection'
import type { MessageNamespace } from './types/messages.types'

export async function ScopedMessages({
  children,
  namespaces,
}: {
  children: ReactNode
  namespaces: readonly MessageNamespace[]
}) {
  const messages = selectRouteMessages(await getMessages(), namespaces)
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
}
