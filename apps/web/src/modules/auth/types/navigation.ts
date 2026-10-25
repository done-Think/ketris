import type { useRouter } from '@/i18n/navigation'

export type AuthNavigationHref = Parameters<ReturnType<typeof useRouter>['replace']>[0]
