import { useMutation } from '@tanstack/react-query'

import { profileMediaService, type ProfileMediaTarget } from '../services/profile-media-service'

export function useUploadProfileMedia() {
  return useMutation({
    mutationFn: ({ file, target }: { file: File; target: ProfileMediaTarget }) =>
      profileMediaService.upload(file, target),
  })
}
