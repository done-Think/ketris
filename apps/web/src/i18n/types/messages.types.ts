import type common from '../messages/pt-BR/common.json'
import type agenda from '../messages/pt-BR/agenda.json'
import type auth from '../messages/pt-BR/auth.json'
import type contracts from '../messages/pt-BR/contracts.json'
import type charges from '../messages/pt-BR/charges.json'
import type crm from '../messages/pt-BR/crm.json'
import type dashboard from '../messages/pt-BR/dashboard.json'
import type face_check from '../messages/pt-BR/face_check.json'
import type marketplace from '../messages/pt-BR/marketplace.json'
import type platform from '../messages/pt-BR/platform.json'
import type properties from '../messages/pt-BR/properties.json'
import type validation from '../messages/pt-BR/validation.json'
import type { MessageKeys, NamespaceKeys, NestedKeyOf, NestedValueOf } from 'use-intl'

export type AppMessages = {
  common: typeof common
  agenda: typeof agenda
  auth: typeof auth
  contracts: typeof contracts
  charges: typeof charges
  crm: typeof crm
  dashboard: typeof dashboard
  face_check: typeof face_check
  marketplace: typeof marketplace
  platform: typeof platform
  properties: typeof properties
  validation: typeof validation
}

export type MessageNamespace = NamespaceKeys<AppMessages, NestedKeyOf<AppMessages>>
export type TranslationKey<Namespace extends MessageNamespace> = MessageKeys<
  NestedValueOf<AppMessages, Namespace>,
  NestedKeyOf<NestedValueOf<AppMessages, Namespace>>
>

export type MetadataNamespace = {
  [Namespace in MessageNamespace]: NestedValueOf<AppMessages, Namespace> extends {
    metadataTitle: string
  }
    ? Namespace
    : never
}[MessageNamespace]
