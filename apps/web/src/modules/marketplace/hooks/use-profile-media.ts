import { useMutation } from '@tanstack/react-query'

import { profileMediaService } from '../services/profile-media-service'
import type { ProfileMediaTarget } from '../types/profile-media'

export function useUploadProfileMedia() {
  return useMutation({
    mutationFn: ({ file, target }: { file: File; target: ProfileMediaTarget }) =>
      profileMediaService.upload(file, target),
  })
}
