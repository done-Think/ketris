import { describe, expect, it } from 'vitest'

import common from '../messages/pt-BR/common.json'
import auth from '../messages/pt-BR/auth.json'
import marketplace from '../messages/pt-BR/marketplace.json'
import platform from '../messages/pt-BR/platform.json'
import dashboard from '../messages/pt-BR/dashboard.json'
import agenda from '../messages/pt-BR/agenda.json'
import {
  selectMessages,
  selectRouteMessages,
  publicMessageNamespaces,
  authMessageNamespaces,
} from '../message-selection'

describe('client message selection', () => {
  const messages = { common, auth, marketplace, platform, dashboard, agenda }

  it('keeps shared notification messages in a platform route without shipping unrelated modules', () => {
    const selected = selectRouteMessages(messages, ['platform'])
    expect(selected).toHaveProperty('dashboard.notificationsCenter', dashboard.notificationsCenter)
    expect(selected).toHaveProperty('agenda.dashboard', agenda.dashboard)
    expect(selected).toHaveProperty('marketplace.profile', marketplace.profile)
    expect(selected).not.toHaveProperty('marketplace.propertyDetail')
    expect(selected).not.toHaveProperty('dashboard.maintenance')
  })

  it.each([{ namespaces: publicMessageNamespaces }, { namespaces: authMessageNamespaces }])(
    'includes notification messages for authenticated visitors of public/auth screens',
    ({ namespaces }) => {
      const selected = selectMessages(messages, namespaces)
      expect(selected).toHaveProperty(
        'dashboard.notificationsCenter',
        dashboard.notificationsCenter,
      )
      expect(selected).toHaveProperty('agenda.dashboard', agenda.dashboard)
      expect(selected).not.toHaveProperty('dashboard.maintenance')
    },
  )

  it('sends only common messages to the root provider', () => {
    expect(selectMessages(messages, [])).toEqual({ common })
    expect(JSON.stringify(selectMessages(messages, [])).length).toBeLessThan(
      JSON.stringify(messages).length / 4,
    )
  })

  it('combines selected subtrees without including unrelated modules', () => {
    const selected = selectMessages(messages, ['auth', 'marketplace.profile'])
    expect(selected).toEqual({ common, auth, marketplace: { profile: marketplace.profile } })
    expect(selected).not.toHaveProperty('platform')
    expect(selected).not.toHaveProperty('marketplace.propertyDetail')
  })

  it('returns copies so one route cannot mutate the catalog used by another route', () => {
    const selected = selectMessages(messages, ['auth'])
    expect(selected.auth).not.toBe(auth)
    expect(selectMessages(messages, ['auth'])).toEqual({ common, auth })
  })
})
