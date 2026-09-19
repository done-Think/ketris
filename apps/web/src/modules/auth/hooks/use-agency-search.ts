import { useQuery } from '@tanstack/react-query'

import { registrationService } from '../services/registration-service'

export function useAgencySearch(query: string) {
  return useQuery({
    queryKey: ['register', 'agencies', query],
    queryFn: () => registrationService.searchAgencies(query),
    enabled: query.length > 0,
  })
}
