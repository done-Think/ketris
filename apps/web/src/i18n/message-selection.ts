import type { AbstractIntlMessages } from 'next-intl'

import type { MessageNamespace } from './types/messages.types'

export const dashboardMessageNamespaces = [
  'marketplace.profile',
  'dashboard.notificationsCenter',
  'agenda.dashboard',
] as const satisfies readonly MessageNamespace[]

export const authMessageNamespaces = [
  ...dashboardMessageNamespaces,
  'auth',
  'marketplace.header',
  'marketplace.footer',
  'marketplace.profile',
] as const satisfies readonly MessageNamespace[]

export const publicMessageNamespaces = [
  'marketplace',
  ...dashboardMessageNamespaces,
] as const satisfies readonly MessageNamespace[]

export function selectRouteMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly MessageNamespace[],
) {
  // Every scoped provider replaces its parent's messages. Shared chrome can render
  // inside any route, including the platform and nested authentication screens.
  return selectMessages(messages, [...dashboardMessageNamespaces, ...namespaces])
}

export function selectMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly MessageNamespace[],
): AbstractIntlMessages {
  const selected: AbstractIntlMessages = {}
  for (const namespace of new Set<MessageNamespace>(['common', ...namespaces])) {
    const segments = namespace.split('.')
    let source: string | AbstractIntlMessages = messages
    for (const segment of segments) {
      if (typeof source === 'string' || !Object.hasOwn(source, segment)) {
        throw new Error(`Missing message namespace: ${namespace}`)
      }
      source = source[segment]
    }

    let destination = selected
    for (const segment of segments.slice(0, -1)) {
      const current = destination[segment]
      if (!current || typeof current === 'string') destination[segment] = {}
      const branch = destination[segment]
      if (typeof branch === 'string') throw new Error(`Invalid message namespace: ${namespace}`)
      destination = branch
    }
    destination[segments[segments.length - 1]] = structuredClone(source)
  }
  return selected
}
