import { useQuery } from '@tanstack/react-query'
import { propertiesService } from '../services/properties-service'

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: () => propertiesService.list(),
  })
}
