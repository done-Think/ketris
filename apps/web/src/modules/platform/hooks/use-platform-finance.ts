import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

import { platformFinanceService } from '../services/platform-finance-service'

export function usePlatformFinance() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['platform', 'finance'],
    queryFn: () => platformFinanceService.get(),
    // Same as the other platform queries: only request once the session token is available.
    enabled: Boolean(session?.accessToken),
  })
}
