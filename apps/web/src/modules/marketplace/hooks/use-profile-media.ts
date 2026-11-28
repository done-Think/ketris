import { useIsMutating, useMutation } from '@tanstack/react-query'

import { marketplaceQueryKeys } from '../config/marketplace-query-keys'
import { profileMediaService } from '../services/profile-media-service'
import type { ProfileMediaTarget } from '../types/profile-media'

export function useUploadProfileMedia() {
  return useMutation({
    mutationKey: marketplaceQueryKeys.profileMediaUpload(),
    mutationFn: ({ file, target }: { file: File; target: ProfileMediaTarget }) =>
      profileMediaService.upload(file, target),
  })
}

export function useIsUploadingProfileMedia() {
  return useIsMutating({ mutationKey: marketplaceQueryKeys.profileMediaUpload() }) > 0
}
