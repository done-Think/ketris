import type {
  StoredProfileMedia,
  UploadedProfileMedia,
  UploadProfileMediaInput,
} from '../../types/profile-media'

export interface ProfileMediaStoragePort {
  upload(input: UploadProfileMediaInput): Promise<UploadedProfileMedia>
  read(objectKey: string): Promise<StoredProfileMedia | null>
}
