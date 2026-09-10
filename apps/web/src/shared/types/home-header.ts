import type { RefObject } from 'react'
import type { LocalizedHref } from './localized-href'

export type HomeHeaderNavigationItem = {
  label: string
  href: LocalizedHref
  active?: boolean
}

export type HomeHeaderUserProfile = {
  name: string
  avatar?: string
}

export type HomeHeaderProps = {
  navigationItems: ReadonlyArray<HomeHeaderNavigationItem>
  profileButtonRef?: RefObject<HTMLButtonElement | null>
  userProfile?: HomeHeaderUserProfile
  onToggleProfile?: () => void
  /**
   * true enquanto a sessão (useSession) ainda não resolveu. Evita mostrar o seletor de idioma por
   * um instante e trocar pro avatar assim que a sessão carrega — mostra um espaço neutro até saber
   * qual dos dois é o estado real.
   */
  isSessionLoading?: boolean
}
