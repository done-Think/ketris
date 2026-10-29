import type { AppMessages } from './types/messages.types'

declare module 'next-intl' {
  interface AppConfig {
    Messages: AppMessages
  }
}
