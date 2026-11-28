import { useQuery } from '@tanstack/react-query'

import { registrationService } from '../services/registration-service'

const MIN_AGENCY_SEARCH_CHARACTERS = 2

export function useAgencySearch(query: string) {
  return useQuery({
    queryKey: ['register', 'agencies', query],
    queryFn: () => registrationService.searchAgencies(query),
    enabled: query.replace(/\s/g, '').length >= MIN_AGENCY_SEARCH_CHARACTERS,
  })
}
